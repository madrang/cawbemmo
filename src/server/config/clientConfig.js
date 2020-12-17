const imageSize = require('image-size');

const events = require('../misc/events');
const tos = require('./tos');

const config = {
	logoPath: null,
	loginBgGeneratorPath: null,
	resourceList: [],
	textureList: [
		'tiles',
		'walls',
		'mobs',
		'bosses',
		'animBigObjects',
		'bigObjects',
		'objects',
		'characters',
		'attacks',
		'ui',
		'auras',
		'animChar',
		'animMob',
		'animBoss',
		'white',
		'ray'
	],
	//Textures that are 24x24. The renderer needs to know this
	bigTextures: [
		'animBigObjects',
		'animBoss',
		'bigObjects',
		'bosses',
		'auras'
	],
	atlasTextures: [
		'tiles',
		'walls',
		'objects'
	],
	tileOpacities: {
		default: {
			default: 0.4,
			max: 1
		},
		tiles: {
			default: 0.4,
			max: 0.55,
			5: 0.7,
			6: 0.9,
			23: 0.9,
			24: 0.9,
			25: 0.9,
			50: 1,
			51: 1,
			52: 1,
			53: 0.7,
			54: 0.5,
			57: 1,
			58: 1,
			59: 1,
			60: 0.9,
			61: 0.9,
			62: 0.75,
			76: 0.9,
			80: 1,
			81: 1,
			82: 1,
			83: 1,
			87: 1,
			90: 1,
			95: 1,
			102: 0.9,
			152: 0.9,
			153: 1,
			163: 0.9,
			//snow
			176: 0.55,
			184: 0.55,
			185: 0.55
		},
		objects: {
			default: 0.9,
			50: 1
		},
		walls: {
			default: 0.85,
			max: 1,
			84: 1,
			103: 0.9,
			107: 0.9,
			116: 1,
			120: 0.9,
			132: 0.9,
			133: 0.9,
			134: 0.85,
			139: 1,
			148: 1,
			150: 0.85,
			156: 1,
			157: 1,
			158: 1,
			159: 1,
			160: 0.9,
			161: 1,
			162: 1,
			163: 1,
			164: 0.8,
			165: 1,
			166: 0.95,
			167: 1,
			168: 1,
			169: 1
		}
	},
	tilesNoFlip: {
		tiles: [
			//Stairs
			171, 179
		],
		walls: [
			//Ledges
			156, 158, 162, 163, 167, 168,
			//Wall Sign
			189,
			//Stone Ledges
			195, 196, 197, 198, 199, 200, 201, 202, 203,
			//Ship Edges
			204, 205, 206, 207, 214, 215, 220, 221, 222, 223,
			//Gray wall sides and corners
			230, 231, 238, 239
		],
		objects: [
			//Clotheslines
			96, 101,
			//Table Sides
			103, 110, 118, 126,
			//Wall-mounted plants
			120, 122, 140,
			//Ship oars
			140, 143,
			//Ship Cannons
			141, 142,
			//Tent Pegs
			168, 169
		]
	},
	uiLoginList: [
		'login'
	],
	uiList: [
		'inventory',
		'equipment',
		'hud',
		'target',
		'menu',
		'spells',
		'messages',
		'online',
		'mainMenu',
		'context',
		'party',
		'help',
		'dialogue',
		'buffs',
		'tooltips',
		'tooltipInfo',
		'tooltipItem',
		'announcements',
		'quests',
		'events',
		'progressBar',
		'stash',
		'talk',
		'trade',
		'overlay',
		'death',
		'leaderboard',
		'reputation',
		'wardrobe',
		'passives',
		'workbench',
		'middleHud',
		'options'
	],
	contextMenuActions: {
		player: [],
		npc: []
	},
	sounds: {
		ui: []
	},
	tos
};

module.exports = {
	config,

	atlasTextureDimensions: {},

	init: async function () {
		events.emit('onBeforeGetClientConfig', config);

		//Deprecated
		events.emit('onBeforeGetResourceList', config.resourceList);
		events.emit('onBeforeGetUiList', config.uiList);
		events.emit('onBeforeGetContextMenuActions', config.contextMenuActions);
		events.emit('onBeforeGetTermsOfService', config.tos);
		events.emit('onBeforeGetTextureList', config.textureList);

		await this.calculateAtlasTextureDimensions();
	},

	//The client needs to know this as well as the map loader
	calculateAtlasTextureDimensions: async function () {
		for (const tex of config.atlasTextures) {
			const path = tex.includes('.png') ? `../${tex}` : `../client/images/${tex}.png`;
			const dimensions = await imageSize(path);

			delete dimensions.type;

			this.atlasTextureDimensions[tex] = dimensions;
		}
	},

	//Used to send to clients
	getClientConfig: function (msg) {
		msg.callback(config);
	}
};
