let map = require('./map');
let syncer = require('./syncer');
let objects = require('../objects/objects');
let spawners = require('./spawners');
let physics = require('./physics');
let resourceSpawner = require('./resourceSpawner');
let spellCallbacks = require('../config/spells/spellCallbacks');
let questBuilder = require('../config/quests/questBuilder');
let events = require('../events/events');
let scheduler = require('../misc/scheduler');
let herbs = require('../config/herbs');
let eventEmitter = require('../misc/events');
const mods = require('../misc/mods');
const transactions = require('../security/transactions');

module.exports = {
	instances: [],
	zoneId: -1,
	speed: consts.tickTime,

	//During regens, adds are placed in a queue
	addQueue: [],

	lastTime: 0,

	init: function (args) {
		this.zoneId = args.zoneId;

		spellCallbacks.init();
		herbs.init();
		map.init(args);

		const fakeInstance = {
			objects,
			syncer,
			physics,
			zoneId: this.zoneId,
			spawners,
			questBuilder,
			events,
			zone: map.zone,
			map,
			scheduler,
			eventEmitter,
			resourceSpawner
		};

		this.instances.push(fakeInstance);

		spawners.init(fakeInstance);
		scheduler.init();

		map.create();
		if (map.mapFile.properties.isRandom) {
			if (!map.oldCollisionMap)
				map.oldCollisionMap = map.collisionMap;

			map.randomMap.init(fakeInstance);
			this.startRegen();
		} else
			_.log('(M ' + map.name + '): Ready');

		map.clientMap.zoneId = this.zoneId;

		[resourceSpawner, syncer, objects, questBuilder, events].forEach(i => i.init(fakeInstance));

		this.tick();
	},

	startRegen: function (respawnMap, respawnPos) {
		this.addQueue = [];

		this.regenBusy = true;

		this.respawnMap = respawnMap;
		this.respawnPos = respawnPos;
	},

	queueMessage: function (msg) {
		this.unqueueMessage(msg);

		this.addQueue.push(msg);
	},

	unqueueMessage: function (msg) {
		this.addQueue.spliceWhere(q => q.obj.id === msg.obj.id);
	},

	tickRegen: function () {
		const { respawnPos, respawnMap } = this;

		//Ensure that all players are gone
		const players = objects.objects.filter(o => o.player);
		players.forEach(p => {
			if (p.destroyed)
				return;

			p.fireEvent('beforeRezone');
			p.destroyed = true;

			const simpleObj = p.getSimple(true, false, true);

			if (respawnPos) {
				const { x, y } = respawnPos;
				simpleObj.x = x;
				simpleObj.y = y;
			}

			process.send({
				method: 'rezone',
				id: p.serverId,
				args: {
					obj: simpleObj,
					newZone: respawnMap,
					keepPos: true
				}
			});
		});

		//Only objects and syncer should update if there are players
		if (players.length) {
			objects.update();
			syncer.update();

			return;
		}

		//Clear stuff
		spawners.reset();

		objects.objects.length = 0;
		objects.objects = [];

		events.stopAll();

		//Try a generation
		const isValid = map.randomMap.generate();

		if (!isValid)
			return;

		map.seed = _.getGuid();

		//If it succeeds, set regenBusy to false and reset vars
		this.regenBusy = false;
		this.respawnPos = null;
		this.respawnMap = null;

		this.addQueue.forEach(q => this.addObject(q));

		this.addQueue = [];

		_.log('(M ' + map.name + '): Ready');
	},

	tick: function () {
		if (this.regenBusy) {
			this.tickRegen();

			setTimeout(this.tick.bind(this), this.speed);

			return;
		}

		events.update();
		objects.update();
		resourceSpawner.update();
		spawners.update();
		syncer.update();
		scheduler.update();
		mods.tick();

		setTimeout(this.tick.bind(this), this.speed);
	},

	addObject: function (msg) {
		if (this.regenBusy) {
			this.queueMessage(msg);

			return;
		}

		let obj = msg.obj;
		obj.serverId = obj.id;
		delete obj.id;

		let spawnPos = map.getSpawnPos(obj);
		let spawnEvent = {
			spawnPos: extend({}, spawnPos),
			changed: false
		};
		eventEmitter.emitNoSticky('onBeforePlayerSpawn', { name: obj.name, instance: { physics } }, spawnEvent);
		if (spawnEvent.changed)
			msg.keepPos = false;

		if (msg.keepPos && (!physics.isValid(obj.x, obj.y) || !map.canPathFromPos(obj)))
			msg.keepPos = false;

		if (!msg.keepPos || !obj.has('x') || (map.mapFile.properties.isRandom && obj.instanceId !== map.seed)) {
			obj.x = spawnPos.x;
			obj.y = spawnPos.y;
		}

		obj.instanceId = map.seed || null;

		obj.spawn = map.spawn;

		syncer.queue('onGetMap', map.clientMap, [obj.serverId]);

		if (!msg.transfer)
			objects.addObject(obj, this.onAddObject.bind(this));
		else {
			let o = objects.transferObject(obj);
			questBuilder.obtain(o);
			eventEmitter.emit('onAfterPlayerEnterZone', o);
		}
	},

	onAddObject: function (obj) {
		if (obj.player) {
			obj.stats.onLogin();
			eventEmitter.emit('onAfterPlayerEnterZone', obj);
		}

		questBuilder.obtain(obj);
		obj.fireEvent('afterMove');

		if (obj.dead) {
			obj.instance.syncer.queue('onDeath', {
				x: obj.x,
				y: obj.y
			}, [obj.serverId]);
		}
	},

	updateObject: function (msg) {
		let obj = objects.find(o => o.serverId === msg.id);
		if (!obj)
			return;

		let msgObj = msg.obj;

		let components = msgObj.components || [];
		delete msgObj.components;

		for (let p in msgObj) 
			obj[p] = msgObj[p];

		let cLen = components.length;
		for (let i = 0; i < cLen; i++) {
			let c = components[i];
			let component = obj[c.type];
			for (let p in c) 
				component[p] = c[p];
		}
	},

	queueAction: function (msg) {
		let obj = objects.find(o => o.serverId === msg.id);
		if (!obj)
			return;
		else if (msg.action.action === 'move') {
			let moveEntries = obj.actionQueue.filter(q => (q.action === 'move')).length;
			if (moveEntries >= 50)
				return;
		}

		obj.queue(msg.action);
	},

	performAction: function (msg) {
		let obj = null;
		let targetId = msg.action.targetId;
		if (!targetId)
			obj = objects.find(o => o.serverId === msg.id);
		else {
			obj = objects.find(o => o.id === targetId);
			if (obj) {
				let action = msg.action;
				if (!action.data)
					action.data = {};
				action.data.sourceId = msg.id;
			}
		}

		if (!obj)
			return;

		obj.performAction(msg.action);
	},

	removeObject: async function (msg) {
		if (this.regenBusy) {
			this.unqueueMessage(msg);

			return;
		}

		let obj = msg.obj;
		obj = objects.find(o => o.serverId === obj.id);
		if (!obj) {
			//We should probably never reach this
			return;
		}

		if (obj.auth)
			await obj.auth.doSave();

		if (obj.player) {
			obj.fireEvent('beforeRezone');

			eventEmitter.emit('onAfterPlayerLeaveZone', obj);
		}

		obj.destroyed = true;

		if (msg.callbackId) {
			process.send({
				module: 'atlas',
				method: 'resolveCallback',
				msg: {
					id: msg.callbackId
				}
			});
		}
	},

	notifyOnceIdle: async function () {
		await transactions.returnWhenDone();

		process.send({
			method: 'onZoneIdle'
		});
	}
};
