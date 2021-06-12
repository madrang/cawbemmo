//Imports
const router = require('../security/router');

//Events
const onHandshake = socket => {
	cons.onHandshake(socket);
};

const onDisconnect = socket => {
	cons.onDisconnect(socket);
};

const onRequest = (socket, msg, callback) => {
	msg.callback = callback;

	if (!msg.data)
		msg.data = {};

	if (msg.cpn) {
		if (!router.allowedCpn(msg))
			return;

		cons.route(socket, msg);
	} else if (msg.threadModule) {
		if (!router.allowedGlobalCall(msg.threadModule, msg.method))
			return;

		cons.route(socket, msg);
	} else {
		if (!router.allowedGlobal(msg))
			return;

		const source = cons.players.find(p => p.socket.id === socket.id);

		msg.socket = socket;

		if (source)
			msg.data.sourceId = source.id;

		global[msg.module][msg.method](msg);
	}
};

const onConnection = socket => {
	socket.on('handshake', onHandshake.bind(null, socket));
	socket.on('disconnect', onDisconnect.bind(null, socket));
	socket.on('request', onRequest.bind(null, socket));

	socket.emit('handshake');
};

//Exports
module.exports = onConnection;
