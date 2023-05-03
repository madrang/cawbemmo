//Imports
const objects = require('../objects/objects');
const events = require('../misc/events');
const {
	getThread, killThread, sendMessageToThread, getThreadFromId, returnWhenThreadsIdle
} = require('./threadManager');

//Exports
module.exports = {
	nextId: 0,
	lastCallbackId: 0,
	callbacks: [],

	addObject: async function (obj, keepPos, transfer) {
		const serverObj = objects.objects.find(o => o.id === obj.id);
		if (!serverObj)
			return;

		events.emit('onBeforePlayerEnterWorld', obj);

		let { zoneName, zoneId } = obj;

		const partyIds = obj.components.find(c => c.type === 'social')?.party;
		if (partyIds) {
			const partyLeader = cons.players.find(p => partyIds.includes(p.id) && p.components.find(c => c.type === 'social').isPartyLeader);

			if (partyLeader?.zoneName === zoneName)
				zoneId = partyLeader.zoneId;
		}

		const { thread, resetObjPosition } = await getThread({
			zoneName,
			zoneId
		});
		
		if (resetObjPosition) {
			delete obj.x;
			delete obj.y;
		}

		obj.zoneName = thread.name;
		obj.zoneId = thread.id;

		serverObj.zoneId = thread.id;
		serverObj.zoneName = thread.name;

		serverObj.player.broadcastSelf();

		const simpleObj = obj.getSimple ? obj.getSimple(true, true) : obj;

		sendMessageToThread({
			threadId: obj.zoneId,
			msg: {
				method: 'addObject',
				args: {
					keepPos: keepPos,
					obj: simpleObj,
					transfer: transfer
				}
			}
		});
	},

	removeObjectFromInstancedZone: async function (thread, obj, callback) {
		await new Promise(res => {
			const cb = this.registerCallback(res);

			thread.worker.send({
				method: 'forceSavePlayer',
				args: {
					playerName: obj.name,
					callbackId: cb
				}
			});
		});

		killThread(thread);

		if (callback)
			callback();
	},

	removeObject: function (obj, skipLocal, callback) {
		if (!skipLocal)
			objects.removeObject(obj);

		const thread = getThreadFromId(obj.zoneId);
		if (!thread)
			return;

		if (thread.instanced) {
			this.removeObjectFromInstancedZone(thread, obj, callback);

			return;
		}

		let callbackId = null;
		if (callback)
			callbackId = this.registerCallback(callback);

		sendMessageToThread({
			threadId: obj.zoneId,
			msg: {
				method: 'removeObject',
				args: {
					obj: obj.getSimple(true),
					callbackId: callbackId
				}
			}
		});
	},
	updateObject: function (obj, msgObj) {
		sendMessageToThread({
			threadId: obj.zoneId,
			msg: {
				method: 'updateObject',
				args: {
					id: obj.id,
					obj: msgObj
				}
			}
		});
	},
	queueAction: function (obj, action) {
		sendMessageToThread({
			threadId: obj.zoneId,
			msg: {
				method: 'queueAction',
				args: {
					id: obj.id,
					action: action
				}
			}
		});
	},
	performAction: function (obj, action) {
		sendMessageToThread({
			threadId: obj.zoneId,
			msg: {
				method: 'performAction',
				args: {
					id: obj.id,
					action: action
				}
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

	returnWhenZonesIdle: async function () {
		await returnWhenThreadsIdle();
	},

	forceSavePlayer: async function (playerName, zoneId) {
		const thread = getThreadFromId(zoneId);

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
