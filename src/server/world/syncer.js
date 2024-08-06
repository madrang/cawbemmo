const { viewDistanceX, viewDistanceY } = consts;

module.exports = {
	buffer: {}
	, dirty: false

	, init: function (msg) {
		this.objects = msg.objects;
	}

	, update: function () {
		const objects = this.objects;
		const oList = objects.objects;
		const pList = oList.filter((f) => f.player && !f.destroyed);
		if (pList.length > 0) {
			this.updateZoneNotEmpty(objects, oList, pList);
		} else {
			this.updateZoneEmpty(objects, oList);
		}
		for (const obj of objects.objects) {
			obj.syncer.reset();
		}
	}

	, updateZoneEmpty: function (objects, oList) {
		const oLen = oList.length;
		for (let i = oLen - 1; i >= 0; --i) {
			const o = oList[i];
			if (!o.destroyed) {
				continue;
			}
			objects.removeObject(o);
		}
		this.sendServerModuleMessages();
	}

	, updateZoneNotEmpty: function (objects, oList, pList) {
		const cache = {};
		const oLen = oList.length;
		for (let i = oLen - 1; i >= 0; --i) {
			const o = oList[i];
			if (!o.syncer) {
				continue;
			}
			let canBeSeenBy = o.canBeSeenBy;
			let oId = o.id;
			let ox = o.x;
			let oy = o.y;
			let destroyed = o.destroyed;
			let sync = null;
			let syncSelf = null;
			if (destroyed) {
				sync = {
					id: o.id
					, destroyed: true
					, destructionEvent: o.destructionEvent
				};
				objects.removeObject(o);
			} else {
				sync = o.syncer.get();
				syncSelf = o.syncer.get(true);
				o.syncer.locked = true;
			}

			let toList = [];
			let completeList = [];
			let completeObj = null;

			let sendTo = false;
			let sendComplete = false;

			const pLen = pList.length;
			for (let j = 0; j < pLen; j++) {
				let p = pList[j];
				let px = p.x;
				let py = p.y;
				const canSee = (
					Math.abs(ox - px) <= viewDistanceX && Math.abs(oy - py) < viewDistanceY
					&& (
						!canBeSeenBy
						|| canBeSeenBy === p.name
					)
				);
				let hasSeen = p.player.hasSeen(oId);
				if (hasSeen) {
					if (canSee) {
						if (p.id === oId && syncSelf) {
							this.queue("onGetObject", syncSelf, [ p.serverId ]);
						}

						if (sync) {
							toList.push(p.serverId);
							sendTo = true;
						}
					}
					if (destroyed || !canSee) {
						if (!canSee) {
							this.queue("onGetObject", {
								id: oId
								, destroyed: true
								, destructionEvent: "visibility"
							},
							[ p.serverId ]);
						}
						p.player.unsee(oId);
					}
				} else if (!destroyed && canSee) {
					if (p.id === oId) {
						let syncO = o.getSimple(true);
						syncO.self = true;
						this.queue("onGetObject", syncO, [ p.serverId ]);
						p.player.see(oId);
						continue;
					}
					let cached = cache[oId];
					if (!cached) {
						cached = cache[oId] = o.getSimple();
					}
					completeObj = cached;
					completeList.push(p.serverId);
					sendComplete = true;
					p.player.see(oId);
				}
			}
			if (sendTo) {
				this.queue("onGetObject", sync, toList);
			}
			if (sendComplete) {
				this.queue("onGetObject", completeObj, completeList);
			}
		}
		this.send();
	}

	, queue: function (event, obj, to) {
		// Send to all players in zone ?
		if (to === -1) {
			to = this.objects.objects.filter((o) => o.player).map((p) => p.serverId);
		}
		if (!to.length) {
			return;
		}
		this.dirty = true;
		const buffer = this.buffer[event] || (this.buffer[event] = []);
		buffer.push({
			to: to
			, obj: obj
		});
	}

	, flushForTarget: function (targetServerId) {
		const buffer = this.buffer;
		for (let p in buffer) {
			const list = buffer[p];
			for (let i = list.length - 1; i >= 0; --i) {
				const l = list[i];
				l.to.spliceWhere((f) => f === targetServerId);
				if (!l.to.length) {
					list.splice(i, 1);
				}
			}
			if (!list.length) {
				delete buffer[p];
			}
		}
	}

	, processDestroyedObject: function (obj) {
		obj.destroyed = true;
		// We mark forceDestroy to tell objects that we're destroying an object outside of the syncer's update method.
		obj.forceDestroy = true;
		this.objects.removeObject(obj);
		this.flushForTarget(obj.serverId);
		const msg = {
			id: obj.id
			, destroyed: true
		};
		// Send to any players that have seen this obj.
		for (const o of this.objects.objects) {
			if (!o.destroyed && o.player?.hasSeen(obj.id)) {
				this.queue("onGetObject", msg, [o.serverId]);
			}
		}
	}

	, send: function () {
		if (!this.dirty) {
			return;
		}
		this.dirty = false;

		process.send({
			method: "events"
			, data: this.buffer
		});
		this.buffer = {};
	}

	, sendServerModuleMessages: function () {
		if (!this.dirty) {
			return;
		}
		this.dirty = false;

		const serverModuleMsgs = this.buffer.serverModule;
		if (serverModuleMsgs) {
			process.send({
				method: "events"
				, data: {
					serverModule: serverModuleMsgs
				}
			});
		}
		this.buffer = {};
	}
};
