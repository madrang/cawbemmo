let childProcess = require('child_process');
let objects = require('../objects/objects');
let mapList = require('../config/maps/mapList');
let connections = require('../security/connections');
let serverConfig = require('../config/serverConfig');
let events = require('../misc/events');

const listenersOnZoneIdle = [];

module.exports = {
	nextId: 0,
	lastCallbackId: 0,
	threads: [],
	callbacks: [],

	init: function () {
		this.getMapFiles();
	},

	addObject: function (obj, keepPos, transfer) {
		events.emit('onBeforePlayerEnterWorld', obj);

		let thread = this.getThreadFromName(obj.zoneName);

		let instanceId = obj.instanceId;
		if ((!thread) || (obj.zoneName !== thread.name))
			instanceId = -1;

		if (!thread) {
			thread = this.getThreadFromName(serverConfig.defaultZone);
			obj.zoneName = thread.name;
		}

		obj.zone = thread.id;
		this.send(obj.zone, {
			method: 'addObject',
			args: {
				keepPos: keepPos,
				obj: obj.getSimple ? obj.getSimple(true, true) : obj,
				instanceId: instanceId,
				transfer: transfer
			}
		});
	},
	removeObject: function (obj, skipLocal, callback) {
		if (!skipLocal)
			objects.removeObject(obj);

		let thread = this.getThreadFromName(obj.zoneName);
		if (!thread)
			return;

		let callbackId = null;
		if (callback)
			callbackId = this.registerCallback(callback);

		obj.zone = thread.id;
		this.send(obj.zone, {
			method: 'removeObject',
			args: {
				obj: obj.getSimple(true),
				instanceId: obj.instanceId,
				callbackId: callbackId
			}
		});
	},
	updateObject: function (obj, msgObj) {
		this.send(obj.zone, {
			method: 'updateObject',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				obj: msgObj
			}
		});
	},
	queueAction: function (obj, action) {
		this.send(obj.zone, {
			method: 'queueAction',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				action: action
			}
		});
	},
	performAction: function (obj, action) {
		this.send(obj.zone, {
			method: 'performAction',
			args: {
				id: obj.id,
				instanceId: obj.instanceId,
				action: action
			}
		});
	},

	registerCallback: function (callback) {
		this.callbacks.push({
			id: ++this.lastCallbackId,
			callback: callback
		});

		return this.lastCallbackId;
	},
	resolveCallback: function (msg) {
		let callback = this.callbacks.spliceFirstWhere(c => c.id === msg.msg.id);
		if (!callback)
			return;

		callback.callback(msg.msg.result);
	},

	send: function (zone, msg) {
		let thread = this.getThreadFromId(zone);
		if (thread)
			thread.worker.send(msg);
	},

	getThreadFromId: function (id) {
		return this.threads.find(t => t.id === id);
	},
	getThreadFromName: function (name) {
		return this.threads.find(t => t.name === name);
	},

	getMapFiles: function () {
		mapList.mapList.filter(m => !m.disabled).forEach(m => this.spawnMap(m));
	},
	spawnMap: function (map) {
		let worker = childProcess.fork('./world/worker');
		let thread = {
			id: this.nextId++,
			name: map.name,
			path: map.path,
			worker: worker
		};

		let onMessage = this.onMessage.bind(this, thread);
		worker.on('message', function (m) {
			onMessage(m);
		});

		this.threads.push(thread);
	},
	onMessage: function (thread, message) {
		if (message.module)
			global[message.module][message.method](message);
		else if (message.event === 'onCrashed') {
			thread.worker.kill();
			process.exit();
		} else
			this.thread[message.method].call(this, thread, message);
	},

	messageAllThreads: function (message) {
		this.threads.forEach(t => t.worker.send(message));
	},

	fireEventOnAllThreads: function ({ msg: { event, data } }) {
		this.threads.forEach(t => t.worker.send({ event, data }));
	},

	thread: {
		onReady: function (thread) {
			thread.worker.send({
				method: 'init',
				args: {
					name: thread.name,
					path: thread.path,
					zoneId: thread.id
				}
			});
		},

		event: function (thread, message) {
			objects.sendEvent(message);
		},

		events: function (thread, message) {
			objects.sendEvents(message);
		},

		object: function (thread, message) {
			objects.updateObject(message);
		},

		track: function (thread, message) {
			let player = objects.objects.find(o => o.id === message.serverId);
			if (!player)
				return;

			player.auth.gaTracker.track(message.obj);
		},

		callDifferentThread: function (thread, message) {
			let obj = connections.players.find(p => (p.name === message.playerName));
			if (!obj)
				return;
			let newThread = this.getThreadFromName(obj.zoneName);
			if (!newThread)
				return;

			newThread.worker.send({
				module: message.data.module,
				method: message.data.method,
				args: message.data.args
			});
		},

		rezone: function (thread, message) {
			const { args: { obj, newZone, keepPos = true } } = message;

			obj.destroyed = false;
			obj.zoneName = newZone;
			obj.id = obj.serverId;

			let serverObj = objects.objects.find(o => o.id === obj.id);
			serverObj.zoneName = obj.zoneName;

			let newThread = this.getThreadFromName(obj.zoneName);

			if (!newThread) {
				newThread = this.getThreadFromName(serverConfig.defaultZone);
				obj.zoneName = newThread.name;
				serverObj.zoneName = newThread.name;
			}

			serverObj.zone = newThread.id;
			obj.zone = newThread.id;

			serverObj.player.broadcastSelf();

			const isRezone = true;
			this.addObject(obj, keepPos, isRezone);
		},

		onZoneIdle: function (thread) {
			listenersOnZoneIdle.forEach(l => l(thread));
		}
	},

	returnWhenZonesIdle: async function () {
		return new Promise(res => {
			const waiting = [...this.threads];

			const onZoneIdle = thread => {
				waiting.spliceWhere(w => w === thread);

				if (waiting.length)
					return;

				listenersOnZoneIdle.spliceWhere(l => l === onZoneIdle);
				res();
			};

			listenersOnZoneIdle.push(onZoneIdle);

			this.threads.forEach(t => {
				t.worker.send({
					method: 'notifyOnceIdle'
				});
			});
		});
	},

	forceSavePlayer: async function (playerName, zoneName) {
		const thread = this.getThreadFromName(zoneName);

		if (!thread)
			return;

		return new Promise(res => {
			const callbackId = this.registerCallback(res);

			thread.worker.send({
				method: 'forceSavePlayer',
				args: {
					playerName,
					callbackId
				}
			});
		});
	}

};
