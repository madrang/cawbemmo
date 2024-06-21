//Imports
const router = require("../security/router");

//Events
const onHandshake = (socket) => {
	cons.onHandshake(socket);
};

const onDisconnect = (socket) => {
	cons.onDisconnect(socket);
};

const onRequest = (socket, msg, callback) => {
	msg.callback = callback;
	if (!msg.data) {
		msg.data = {};
	}

	const source = cons.players.find((p) => p.socket.id === socket.id);
	if (!router.isMsgValid(msg, source)) {
		_.log.route.warn("Discarded invalid message %o from %s", msg, source.name || source.id || "unknown");
		return;
	}
	if (msg.cpn || msg.threadModule) {
		cons.route(socket, msg);
	} else {
		msg.socket = socket;
		if (source) {
			msg.data.sourceId = source.id;
		}
		cons.routeGlobal(msg);
	}
};

const onConnection = (socket) => {
	_.log.connections.debug("New WebSocket connection from %s", socket.request.connection.remoteAddress);

	socket.on("handshake", onHandshake.bind(null, socket));
	socket.on("disconnect", onDisconnect.bind(null, socket));
	socket.on("request", onRequest.bind(null, socket));

	socket.emit("handshake");
};

//Exports
module.exports = onConnection;
