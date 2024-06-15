require('./globals');

const server = require('./server/index');
const components = require('./components/components');
const mods = require('./misc/mods');
const animations = require('./config/animations');
const skins = require('./config/skins');
const factions = require('./config/factions');
const classes = require('./config/spirits');
const spellsConfig = require('./config/spellsConfig');
const spells = require('./config/spells');
const itemTypes = require('./items/config/types');
const salvager = require('./items/salvager');
const recipes = require('./config/recipes/recipes');
const mapManager = require('./world/mapManager');
const fixes = require('./fixes/fixes');
const profanities = require('./language/profanities');
const routerConfig = require('./security/routerConfig');
const { spawnMapThreads } = require('./world/threadManager');

let startup = {
	init: function () {
		io.init(this.onDbReady.bind(this));
	},

	onDbReady: async function () {
		await fixes.fixDb();

		process.on('unhandledRejection', this.onError.bind(this));
		process.on('uncaughtException', this.onError.bind(this));

		await mods.init();

		this.onModsLoaded();
	},

	onModsLoaded: function () {
		animations.init();
		routerConfig.init();
		classes.init();
		spellsConfig.init();
		spells.init();
		recipes.init();
		itemTypes.init();
		salvager.init();
		profanities.init();
		mapManager.init();
		components.init(this.onComponentsReady.bind(this));
	},

	onComponentsReady: async function () {
		skins.init();
		factions.init();

		await clientConfig.init();
		await server.init();
		await leaderboard.init();

		await spawnMapThreads();
	},

	onError: async function (e) {
		if (e.toString().indexOf('ERR_IPC_CHANNEL_CLOSED') >= 0) {
			return;
		}
		_.log.error(`Error Logged: ${e.toString()}\r\n`, e.stack);
		await io.setAsync({
			key: new Date(),
			table: 'error',
			value: e.toString() + ' | ' + e.stack.toString()
		});
		process.exit();
	}
};

startup.init();
