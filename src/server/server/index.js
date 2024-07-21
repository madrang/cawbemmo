//Imports
const http = require("http");

const socketIo = require("socket.io");

const express = require("express");
const compression = require("compression");
const minify = require("express-minify");
const lessMiddleware = require("less-middleware");
const cookieParser = require("cookie-parser");

const fileLister = require("../misc/fileLister");
const rest = require("../security/rest");

const API_ROUTES = {
	auth: {
		secret: undefined
	}
}

const {
	port = 4000,
	startupMessage = "Server: Ready",
	nodeEnv
} = require("../config/serverConfig");

const IS_PROD = nodeEnv === "production";

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

const loadRoute = function(rName, options, loadedAPIs) {
	const routeModule = require("./routes/" + rName);
	if ("createRouter" in routeModule) {
		routeModule.router = routeModule.createRouter(options, loadedAPIs);
		delete routeModule.createRouter;
	}
	loadedAPIs[rName] = routeModule;
	return routeModule;
};

//Methods
const init = async () => {
	const app = express();
	const server = http.createServer(app);
	const socketServer = socketIo(server, {
		transports: ["websocket"]
	});
	global.cons.sockets = socketServer.sockets;

	app.use(compression());
	if (IS_PROD) {
		app.use(minify());
	}

	app.use(cookieParser());
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
	app.get("/logout", (req, res) => {
		res.cookie("jwt", "", { maxAge: "1" });
		res.redirect("/");
	});

	const loadedAPIs = {};
	for (const apiName in API_ROUTES) {
		const routeModule = loadRoute(apiName, API_ROUTES[apiName], loadedAPIs);
		app.use("/api/" + apiName, routeModule.router);
		API_ROUTES[apiName] = routeModule;
	}
	const routeFiles = fileLister.getFiles("./server/routes/");
	for (const fName of routeFiles) {
		if (!fName.endsWith(".js")) {
			continue;
		}
		const apiName = fName.slice(0, fName.lastIndexOf("."));
		if (API_ROUTES[apiName]) {
			continue;
		}
		const routeModule = loadRoute(apiName, {}, loadedAPIs);
		app.use("/api/" + apiName, routeModule.router);
		API_ROUTES[apiName] = routeModule;
	}
	app.get("/admin", appRoot);
	app.get("/admin", API_ROUTES.auth.createAuth(99), appFile);

	app.use((req, res, next) => {
		if (!rest.willHandle(req.url) && !sharedFolders.some((s) => req.url.startsWith(s))) {
			req.url = `/client/${req.url}`;
		}
		next();
	});
	app.use(lessMiddleware("../", {
		once: IS_PROD
		, force: !IS_PROD
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
