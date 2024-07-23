const workerConfig = JSON.parse(process.argv[2]);

// Globals
global._ = require("../misc/helpers");
// Configure logger base name
_.log = _.log.worker[`Map/${workerConfig.name}`];
// Log warnings
process.on("warning", (e) => {
	_.log.warn(`Warning: ${e.toString()}\r\n`, e.stack);
});

global.io = require("../db/io");
global.consts = require("../config/consts");

global.instancer = require("./instancer");
instancer.mapName = workerConfig.name;

global.eventManager = require("../events/events");
global.clientConfig = require("../config/clientConfig");
global.rezoneManager = require("./rezoneManager");
require("../misc/random");

const mods = require("../misc/mods");
const eventEmitter = require("../misc/events");

// Components Imports
const COMPONENTS_CONFIGURATIONS_PATHS = {
	components: "../components/components"

	, factions: "../config/factions"
	, skins: "../config/skins"
	, animations: "../config/animations"

	, classes: "../config/spirits"
	, spellsConfig: "../config/spellsConfig"
	, spells: "../config/spells"

	, itemTypes: "../items/config/types"
	, salvager: "../items/salvager"
	, mapManager: "../world/mapManager"
	, recipes: "../config/recipes/recipes"
	, itemEffects: "../items/itemEffects"
	, profanities: "../language/profanities"
};

(async function () {
	// Init database
	await new Promise(resolve => io.init(resolve));
	// Add crash loggers
	const onCrash = async (e) => {
		if (e.toString().indexOf("ERR_IPC_CHANNEL_CLOSED") >= 0) {
			return;
		}
		_.log.fatal(`Error Logged: ${e.toString()}\r\n`, e.stack);
		await io.setAsync({
			key: new Date()
			, table: "error"
			, value: e.toString() + " | " + e.stack.toString()
		});
		process.send({ event: "onCrashed"
			, name: workerConfig.name
		});
	};
	process.on("uncaughtException", onCrash);
	process.on("unhandledRejection", onCrash);
	// Load mods
	await mods.init({ logger: _.log.mods });
	// and then load the components configurations.
	await _.requireAll(module, COMPONENTS_CONFIGURATIONS_PATHS, (c) => c.init(), _.log.ComponentsConfiguration);

	rezoneManager.init();
	await clientConfig.init();

	// Start listening to messages.
	process.on("message", (m) => {
		if (m.module) {
			const instances = instancer.instances;
			const iLen = instances.length;
			for (let i = 0; i < iLen; i++) {
				const objects = instances[i].objects.objects;
				const oLen = objects.length;
				let found = false;
				for (let j = 0; j < oLen; j++) {
					const object = objects[j];

					if (object.name === m.args[0]) {
						const mod = object.instance[m.module];
						mod[m.method].apply(mod, m.args);

						found = true;
						break;
					}
				}
				if (found) {
					break;
				}
			}
		} else if (m.threadModule) {
			global[m.threadModule][m.method](m.data);
		} else if (m.method) {
			instancer[m.method](m.args);
		} else if (m.event) {
			eventEmitter.emit(m.event, m.data);
		}
	});
	// Notify parent that worker is ready.
	process.send({
		method: "onReady"
	});
})().catch(
	(reason) => {
		_.log.fatal(`Failed to initialize components: ${reason.toString()}\r\n`, reason.stack);
		process.send({ event: "onCrashed"
			, name: workerConfig.name
		});
		process.exit();
	}
);
