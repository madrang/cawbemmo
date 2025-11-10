import { io } from "/js/dependencies/socket.io.esm.min.js";
import events from "/js/system/events.js";

const canReachServer = async () => {
	try {
		const response = await fetch("/", {
			method: "HEAD"
		});
		return response.ok;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err);
		return false;
	}
};
const createProxyFunction = (sendRequestFn, msgBase) => {
	return new Proxy(sendRequestFn, {
		apply (target, thisArg, argumentsList) {
			if (!msgBase || !msgBase.method) {
				throw new Error("Request method is missing, needed before apply!");
			}
			const promiseSrc = new _.PromiseSource();
			const tRef = setTimeout(() => {
				promiseSrc.reject(new Error("Request timeout out!"));
			}, 30 * 1000);
			const reqObj = Object.assign({
				callback: (value) => {
					clearTimeout(tRef);
					promiseSrc.resolve(value);
				}
			}, msgBase);
			if (Array.isArray(argumentsList) && argumentsList.length > 0) {
				reqObj.data = argumentsList[0];
			}
			target(reqObj);
			return promiseSrc.promise;
		}
	});
};
const createRequestProxy = (clientTarget, propName, msgBase = {}) => {
	if (!propName) {
		throw new Error("Missing propName!");
	}
	const childsMap = new Map();
	return new Proxy(clientTarget, {
		get (target, prop, receiver) {
			const cachedInstance = childsMap.get(prop);
			if (cachedInstance) {
				return cachedInstance;
			}

			const newMsgBase = Object.assign({ [propName]: prop }, msgBase);

			if (propName === "method") {
				const fnProx = createProxyFunction(target.request.bind(target), newMsgBase);
				childsMap.set(prop, fnProx);
				return fnProx;
			}

			const objProx = createRequestProxy(target, "method", newMsgBase);
			childsMap.set(prop, objProx);
			return objProx;
		}
		, set (target, prop, value) {
			throw new Error("Read only value!");
		}
	});
};
const client = {
	init: async function () {
		this.socket = io({
			transports: [ "websocket" ]
		});

		const promiseSrc = new _.PromiseSource();
		const tRef = setTimeout(() => {
			promiseSrc.reject(new Error("Websocket connection timeout out!"));
		}, 30 * 1000);
		this.socket.on("connect", promiseSrc.resolve);
		this.socket.on("handshake", this.onHandshake.bind(this));
		this.socket.on("event", this.onEvent.bind(this));
		this.socket.on("events", this.onEvents.bind(this));
		// Asked to disconnect.
		this.socket.on("dc", this.onDisconnect.bind(this));
		// Was disconnected.
		this.socket.on("disconnect", this.onDisconnect.bind(this));

		for (const k in this.processAction) {
			this.processAction[k] = this.processAction[k].bind(this);
		}

		this.moduleProxy = createRequestProxy(this, "module");
		this.componentProxy = createRequestProxy(this, "cpn");
		this.threadProxy = createRequestProxy(this, "threadModule");

		await promiseSrc.promise;
		clearTimeout(tRef);
	}

	, onRezoneStart: function () {
		//Fired for mods to listen to
		events.emit("rezoneStart");

		events.emit("destroyAllObjects");
		events.emit("resetRenderer");
		events.emit("resetPhysics");
		events.emit("clearUis");

		client.request({
			threadModule: "rezoneManager"
			, method: "clientAck"
			, data: {}
		});
	}

	, onGetMap: function ([msg]) {
		events.emit("onGetMap", msg);

		client.request({
			threadModule: "instancer"
			, method: "clientAck"
			, data: {}
		});
	}

	, onDisconnect: async function () {
		this.socket.disconnect();
		events.emit("onGetAnnouncement", {
			msg: "Connection lost, please wait while we try to reconnect..."
			, ttl: 350
		});
		let isOnline = false;
		while (!isOnline) {
			await _.asyncDelay(3000);
			isOnline = await canReachServer();
		}
		// Reload page
		window.location = window.location;
	}

	, onHandshake: function () {
		events.emit("onHandshake");
		this.socket.emit("handshake");
	}

	, request: function (...args) {
		if (args.length === 1) {
			return this.socket.emit("request", args[0], args[0].callback);
		}
		return this.socket.emit("request", ...args);
	}

	, processAction: {
		default: function (eventName, msgs) {
			for (const m of msgs) {
				events.emit(eventName, m);
			}
		}

		, rezoneStart: function (eventName, msgs) {
			events.emit("rezoneStart");

			events.emit("destroyAllObjects");
			events.emit("resetRenderer");
			events.emit("resetPhysics");
			events.emit("clearUis");

			client.request({
				threadModule: "rezoneManager"
				, method: "clientAck"
				, data: {}
			});
		}

		, getMap: function (eventName, msgs) {
			events.emit("onBuildIngameUis");
			events.emit("onGetMap", msgs[0]);
		}

		, onGetObject: function (eventName, msgs) {
			// Move self messages first.
			msgs = msgs.filter((o) => o.self).concat(msgs.filter((o) => !o.self));
			this.processAction.default(eventName, msgs);
		}
	}

	, onEvent: function ({ event: eventName, data: eventData }) {
		const handler = this.processAction[eventName] || this.processAction.default;
		handler(eventName, [eventData]);
	}

	, onEvents: function (response) {
		for (let eventName in response) {
			const handler = this.processAction[eventName] || this.processAction.default;
			const eventMsgs = response[eventName];
			handler(eventName, eventMsgs);
		}
	}
};

export default client;
