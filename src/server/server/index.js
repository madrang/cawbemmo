//Imports
const http = require("http");

const socketIo = require("socket.io");

const express = require("express");
const compression = require("compression");
const minify = require("express-minify");
const lessMiddleware = require("less-middleware");

const rest = require("../security/rest");

const {
	port = 4000,
	startupMessage = "Server: Ready",
	nodeEnv
} = require("../config/serverConfig");

const compileLessOnce = nodeEnv === "production";

const onConnection = require("./onConnection");
const { appRoot, appFile } = require("./requestHandlers");

const sharedFolders = [
	"/common"
	, "/server"
	, "/mods"
];

const onNewLogEvent = function(req, entry) {
	if (typeof entry !== "object") {
		_.log.UserLog[req.ip].info(entry);
		return;
	}
	if (!Array.isArray(entry) || typeof entry[0] !== "number") {
		_.log.UserLog[req.ip].info(JSON.stringify(entry, undefined, 4));
		return;
	}
	const logLevel = entry.shift();
	_.log.UserLog[req.ip].print(logLevel, entry);
}

//Methods
const init = async () => {
	const app = express();
	const server = http.createServer(app);
	const socketServer = socketIo(server, {
		transports: ["websocket"]
	});
	global.cons.sockets = socketServer.sockets;

	app.use(compression());
	app.use(minify());

	app.use(express.json());
	app.post("/log", (req, res) => {
		if (Array.isArray(req.body)) {
			for (const entry of req.body) {
				onNewLogEvent(req, entry);
			}
		} else {
			onNewLogEvent(req, req.body);
		}
		res.send({ response: "ok" });
	});

	app.use((req, res, next) => {
		if (!rest.willHandle(req.url) && !sharedFolders.some((s) => req.url.startsWith(s))) {
			req.url = `/client/${req.url}`;
		}
		next();
	});
	app.use(lessMiddleware("../", {
		once: compileLessOnce
		, force: !compileLessOnce
	}));

	rest.init(app);

	app.get("/", appRoot);
	app.get(/^(.*)$/, appFile);

	socketServer.on("connection", onConnection);
	await new Promise((resolve) => server.listen(port, resolve));
	_.log.Server.info(startupMessage);
};

//Exports
module.exports = {
	init
};
