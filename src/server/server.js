//Imports
const http = require('http');

const socketIo = require('socket.io');

const express = require('express');
const compression = require('compression');
const minify = require('express-minify');

const router = require('./security/router');
const rest = require('./security/rest');

const {
	port = 4000,
	startupMessage = 'Server: Ready'
} = require('./config/serverConfig');

//Methods
const listeners = {
	onConnection: function (socket) {
		socket.on('handshake', listeners.onHandshake.bind(null, socket));
		socket.on('disconnect', listeners.onDisconnect.bind(null, socket));
		socket.on('request', listeners.onRequest.bind(null, socket));

		socket.emit('handshake');
	},
	onHandshake: function (socket) {
		cons.onHandshake(socket);
	},
	onDisconnect: function (socket) {
		cons.onDisconnect(socket);
	},
	onRequest: function (socket, msg, callback) {
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

			msg.socket = socket;
			global[msg.module][msg.method](msg);
		}
	}
};

const requests = {
	root: function (req, res) {
		res.sendFile('index.html');
	},
	default: function (req, res) {
		let root = req.url.split('/')[1];
		let file = req.params[0];
		
		file = file.replace('/' + root + '/', '');
		
		const validModPatterns = ['.png', '/ui/', '/clientComponents/', '/audio/'];
		
		const validRequest = (
			root !== 'server' ||
				(
					file.includes('mods/') &&
					validModPatterns.some(v => file.includes(v))
				)
		);
		
		if (!validRequest)
			return null;
		
		res.sendFile(file, {
			root: '../' + root
		});
	}
};

const init = async () => {
	return new Promise(resolve => {
		const app = express();
		const server = http.createServer(app);
		const socketServer = socketIo(server, {
			transports: ['websocket']
		});

		global.cons.sockets = socketServer.sockets;

		app.use(compression());
		app.use(minify());

		app.use(function (req, res, next) {
			if (
				!rest.willHandle(req.url) && 
				req.url.indexOf('/server') !== 0 && 
				req.url.indexOf('/mods') !== 0
			)
				req.url = '/client/' + req.url;

			next();
		});

		rest.init(app);

		app.get('/', requests.root);
		app.get(/^(.*)$/, requests.default);

		socketServer.on('connection', listeners.onConnection);

		server.listen(port, function () {
			_.log(startupMessage);

			resolve();
		});
	});
};

//Exports
module.exports = {
	init
};
