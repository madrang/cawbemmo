//System Imports
const childProcess = require("child_process");

//Imports
const objects = require("../objects/objects");
const { getMapList } = require("./mapManager");
const { registerCallback } = require("./atlas/registerCallback");

//Internals
const threads = [];
const listenersOnZoneIdle = [];

//Helpers
const getThreadFromName = (name) => {
	return threads.find((t) => t.name === name);
};

const getThreadFromId = (threadId) => {
	return threads.find((t) => t.id === threadId);
};

const getPlayerCountInThread = async (thread) => {
	const { playerCount } = await new Promise((res) => {
		thread.worker.send({
			method: "getThreadStatus"
			, args: {
				callbackId: registerCallback(res)
			}
		});
	});
	return playerCount;
};

const killThread = (thread) => {
	_.log.threadManager.debug("Unloading empty zone (Map/%s).", thread.name || thread.id);
	thread.worker.kill();
	threads.spliceWhere((t) => t === thread);
};

const killThreadIfEmpty = async (thread) => {
	const playerCount = await getPlayerCountInThread(thread);
	if (playerCount === 0) {
		killThread(thread);
	}
};

const messageHandlers = {
	onReady: function (thread) {
		thread.worker.send({
			method: "init"
			, args: {
				zoneName: thread.name
				, zoneId: thread.id
				, path: thread.path
			}
		});
	}

	, onInitialized: function (thread) {
		thread.isReady = true;

		thread.cbOnInitialized(thread);
		delete thread.cbOnInitialized;
		delete thread.promise;
	}

	, event: function (thread, message) {
		objects.sendEvent(message, thread);
	}

	, events: function (thread, message) {
		objects.sendEvents(message, thread);
	}

	, object: function (thread, message) {
		objects.updateObject(message);
	}

	, track: function (thread, message) {
		let player = objects.objects.find((o) => o.id === message.serverId);
		if (!player) {
			return;
		}

		player.auth.gaTracker.track(message.obj);
	}

	, callDifferentThread: function (thread, message) {
		let obj = cons.players.find((p) => (p.name === message.playerName));
		if (!obj) {
			return;
		}

		let newThread = getThreadFromName(obj.zoneName);
		if (!newThread) {
			return;
		}

		newThread.worker.send({
			module: message.data.module
			, method: message.data.method
			, args: message.data.args
		});
	}

	, rezone: async function (thread, message) {
		const { args: { obj, newZone, keepPos = true } } = message;

		if ((await getPlayerCountInThread(thread)) === 0) {
			killThread(thread);
		}

		//When messages are sent from map threads, they have an id (id of the object in the map thread)
		// as well as a serverId (id of the object in the main thread)
		const serverId = obj.serverId;
		obj.id = serverId;
		obj.destroyed = false;

		const serverObj = objects.objects.find((o) => o.id === obj.id);
		const mapList = getMapList();
		const mapExists = mapList.some((m) => m.name === newZone);

		if (mapExists) {
			serverObj.zoneName = newZone;
			obj.zoneName = newZone;
		} else {
			obj.zoneName = clientConfig.config.defaultZone;
			serverObj.zoneName = clientConfig.config.defaultZone;
		}

		delete serverObj.zoneId;
		delete obj.zoneId;

		const isRezone = true;
		await atlas.addObject(obj, keepPos, isRezone);
	}

	, onZoneIdle: function (thread) {
		listenersOnZoneIdle.forEach((l) => l(thread));
	}
};

const onMessage = (thread, message) => {
	if (message.module) {
		try {
			global[message.module][message.method](message);
		} catch (e) {
			/* eslint-disable-next-line no-console */
			console.error("Global method error", message.module, message.method, e);
			process.exit();
		}
	} else if (message.event === "onCrashed") {
		thread.worker.kill();
		process.exit();
	} else {
		messageHandlers[message.method](thread, message);
	}
};

const spawnThread = async ({ name, path, instanced }) => {
	let cbOnInitialized;
	const promise = new Promise((resolveOnReady) => {
		cbOnInitialized = resolveOnReady;
	});
	const worker = childProcess.fork("./world/worker", [name]);
	const id = instanced ? _.getGuid() : name;
	const thread = {
		id
		, name
		, instanced
		, path
		, worker
		, isReady: false
		, promise
		, cbOnInitialized
	};
	worker.on("message", onMessage.bind(null, thread));
	threads.push(thread);
	return promise;
};

const doesThreadExist = ({ zoneName, zoneId }) => {
	const mapList = getMapList();
	let map = mapList.find((m) => m.name === zoneName);
	if (!map) {
		map = mapList.find((m) => m.name === clientConfig.config.defaultZone);
	}
	const exists = threads.some((t) => t.id === zoneId && t.name === zoneName);
	if (exists) {
		return true;
	}
	const thread = getThreadFromName(map.name);
	return Boolean(thread);
};

const getThread = async ({ zoneName, zoneId }) => {
	const result = {
		resetObjPosition: false
		, thread: null
	};
	const mapList = getMapList();
	let map = mapList.find((m) => m.name === zoneName);
	if (!map) {
		map = mapList.find((m) => m.name === clientConfig.config.defaultZone);
	}
	let thread = threads.find((t) => t.id === zoneId && t.name === zoneName);
	if (!thread) {
		if (map.instanced) {
			result.resetObjPosition = true;
			thread = await spawnThread(map);
		} else {
			thread = getThreadFromName(map.name) || await spawnThread(map);
		}
	}
	if (!thread) {
		io.logError({
			sourceModule: "threadManager"
			, sourceMethod: "getThread"
			, error: "No thread found"
			, info: {
				requestedZoneName: zoneName
				, requestedZoneId: zoneId
				, useMapName: map.name
			}
		});
		process.exit();
	}
	if (!thread.isReady) {
		await thread.promise;
	}
	result.thread = thread;
	return result;
};

const sendMessageToThread = ({ threadId, msg }) => {
	const thread = threads.find((t) => t.id === threadId);
	if (thread) {
		thread.worker.send(msg);
	}
};

const messageAllThreads = (message) => {
	for (const t of threads) {
		t.worker.send(message);
	}
};

const returnWhenThreadsIdle = async () => {
	return new Promise((res) => {
		let doneCount = 0;
		const onZoneIdle = (thread) => {
			doneCount++;
			if (doneCount.length < threads.length) {
				return;
			}
			listenersOnZoneIdle.spliceWhere((l) => l === onZoneIdle);
			res();
		};
		listenersOnZoneIdle.push(onZoneIdle);
		messageAllThreads({
			method: "notifyOnceIdle"
		});
	});
};

//Exports
module.exports = {
	getThread
	, killThread
	, getThreadFromId
	, doesThreadExist
	, messageAllThreads
	, killThreadIfEmpty
	, sendMessageToThread
	, returnWhenThreadsIdle
	, getPlayerCountInThread
};
