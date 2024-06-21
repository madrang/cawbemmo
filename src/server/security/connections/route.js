//Imports
const { sendMessageToThread } = require("../../world/threadManager");

//Helpers
const route = function (socket, msg) {
	const source = this.players.find((p) => p.socket.id === socket.id);
	if (!source) {
		_.log.route.warn("Can't route message %o, player source not found.", msg);
		return;
	}
	if (!msg.data) {
		msg.data = {};
	}
	msg.data.sourceId = source.id;

	if (
		(
			(source.permadead) &&
			(["getCharacterList", "getCharacter", "deleteCharacter"].indexOf(msg.method) === -1)
		) ||
		(
			source.dead &&
			!(
				(msg.method === "performAction" && ["respawn"].includes(msg.data.method)) ||
				(msg.method === "clientAck")
			)
		)
	) {
		_.log.route.notice("Denied player %s access to %s", source.name, msg.method);
		return;
	}

	if (msg.threadModule) {
		if (msg.callback) {
			msg.data.callbackId = atlas.registerCallback(msg.callback);
		}
		sendMessageToThread({
			threadId: source.zoneId
			, msg
		});
		return;
	}

	let target = source;
	if (msg.data.targetId !== undefined && msg.data.cpn === undefined) {
		target = this.players.find((p) => p.id === msg.data.targetId);
		if (!target) {
			_.log.route.error("%s from $s couldn't be routed! Target %s can't be found.", msg.method, source.name, msg.data.targetId);
			return;
		}
	}

	const cpn = target[msg.cpn];
	if (!cpn) {
		_.log.route.error("%s from $s couldn't be routed! Component %s can't be found.", msg.method, source.name, msg.cpn);
		return;
	}

	const method = msg.method;
	if (typeof cpn[method] === "function") {
		cpn[method](msg);
	} else {
		_.log.route.error("Component %s doesn't have a method %s. Message from %s was dropped!", msg.cpn, msg.method, source.name);
	}
};

const routeGlobal = function (msg) {
	global[msg.module][msg.method](msg);
};

//Exports
module.exports = {
	route
	, routeGlobal
};
