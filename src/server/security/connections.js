//External Modules
const objects = require("../objects/objects");
const eventEmitter = require("../misc/events");

//Helpers
const { route, routeGlobal } = require("./connections/route");

//Module
module.exports = {
	players: []
	, sockets: null

	, onHandshake: function (socket) {
		if (this.players.some((f) => f.socket.id === socket.id)) {
			return;
		}

		const p = objects.build();
		p.socket = socket;
		p.addComponent("auth");
		p.addComponent("player");

		objects.pushObjectToList(p);
		this.players.push(p);

		const clientIp = socket.request.connection.remoteAddress;
		_.log.connections.debug("%s completed handshake. --> Now known as Player(%s)", clientIp, p.id);
	}

	, onDisconnect: async function (socket) {
		const clientIp = socket.request.connection.remoteAddress;
		const player = this.players.find((p) => p.socket.id === socket.id);
		if (!player) {
			_.log.connections.debug("%s closed WebSocked without completing handshake.", clientIp);
			return;
		}
		if (!player.has("id")) {
			this.players.spliceWhere((p) => p.socket.id === socket.id);
			_.log.connections.warn("Player %s disconnected with a missing object id.", clientIp);
			return;
		}
		// Disconnect player and remove object from other clients.
		if (player.social) {
			player.social.dc();
		}
		const sessionDuration = (typeof player?.player?.sessionStart === "number"
			? Math.floor((Date.now() - player.player.sessionStart) / 1000)
			: 0
		);
		atlas.updateObject(player, {
			components: [{
				type: "stats"
				, sessionDuration
			}]
		});
		//If the player doesn't have a 'social' component, they are no longer in a threat
		// Likely due to unzoning (character select screen)
		// Also, rezoning is set to true while rezoning so we don't try to remove objects
		// from zones if they are currently rezoning
		if (player.components.some((c) => c.type === "social") && player.rezoning !== true) {
			await new Promise((res) => {
				atlas.removeObject(player, false, res);
			});
		}
		if (player.name) {
			eventEmitter.emit("playerObjRemoved", {
				id: player.id
			});
		}
		_.log.connections.info("Player %s disconnected after %s seconds", player.name || player.id, sessionDuration);
		this.players.spliceWhere((p) => p.socket.id === socket.id);
	}

	, route: function (socket, msg) {
		route.call(this, socket, msg);
	}

	, routeGlobal: function (msg) {
		routeGlobal.call(this, msg);
	}

	, setupEventForwarder: function(forwardEvents) {
		for (const eName of forwardEvents) {
			eventEmitter.on(eName, (function(msg) {
				for (const propName in msg) {
					if (!msg.hasOwnProperty(propName)) {
						continue;
					}
					if (typeof msg[propName].getSimple === "function") {
						msg[propName] = msg[propName].getSimple(false, false, true);
					}
				}
				this.emit("event", {
					event: eName
					, data: msg
				});
			}).bind(this));
		}
	}

	, unzone: async function (msg) {
		let socket = msg.socket;
		let player = this.players.find((p) => p.socket.id === socket.id);

		if (!player) {
			return;
		}

		if (player.social) {
			player.social.dc();
		}

		await new Promise((res) => {
			atlas.removeObject(player, true, res);
		});

		let keys = Object.keys(player);
		keys.forEach(function (k) {
			let val = player[k];
			if (val && val.type) {
				if (["player", "auth", "syncer"].indexOf(val.type) === -1) {
					delete player[k];

					player.components.spliceWhere((c) => c.type === val.type);
				}
			}
		});

		eventEmitter.emit("playerObjRemoved", {
			id: player.id
		});

		//If we don't do this, the atlas will try to remove it from the thread
		delete player.zoneName;
		delete player.name;

		//A hack to allow us to actually call methods again (like retrieve the player list)
		player.dead = false;
		player.permadead = false;
		delete player.auth.charname;

		msg.callback();
	}

	, logOut: async function (exclude) {
		const { players } = this;

		let pLen = players.length;
		for (let i = 0; i < pLen; i++) {
			const p = players[i];

			if (!p || p === exclude || !p.auth) {
				continue;
			} else if (p.auth.username === exclude.auth.username) {
				if (p.name && p.zoneId) {
					await atlas.forceSavePlayer(p.id, p.zoneId);
				}
				if (p.socket?.connected) {
					p.socket.emit("dc", {});
				} else {
					players.splice(i, 1);
					i--;
					pLen--;
				}
			}
		}
	}

	, emit: function (event, msg) {
		this.sockets.emit(event, msg);
	}

	, getCharacterList: function () {
		let result = [];
		let players = this.players;
		let pLen = players.length;
		for (let i = 0; i < pLen; i++) {
			let p = players[i];
			if (!p.name) {
				continue;
			}
			result.push({
				zoneName: p.zoneName
				, zoneId: p.zoneId
				, name: p.name
				, level: p.level
				, class: p.class
				, id: p.id
			});
		}
		return result;
	}

	, forceSaveAll: async function () {
		const promises = this.players
			.filter((p) => p.zoneName !== undefined)
			.map((p) => {
				const promise = new Promise((res) => {
					const msg = {
						cpn: "auth"
						, method: "doSaveManual"
						, data: {
							callbackId: atlas.registerCallback(res)
						}
					};
					atlas.performAction(p, msg);
				});
				return promise;
			});
		await Promise.all(promises);
	}
};
