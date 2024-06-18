const imageSize = require("image-size");

const events = require("../misc/events");
const fileLister = require("../misc/fileLister");
const tos = require("./tos");

const config = {
	logoPath: null
	, loginBgGeneratorPath: null
	, resourceList: []
	, defaultZone: "town"
	, textureList: [
		"tiles"
		, "walls"
		, "objects"
		, "mobs"
		, "bosses"
		, "animBigObjects"
		, "bigObjects"
		, "characters"
		, "attacks"
		, "ui"
		, "auras"
		, "animChar"
		, "animMob"
		, "animBoss"
		, "white"
		, "ray"
	]
	, atlasTextureDimensions: {}
	, atlasTextures: [
		"tiles"
		, "walls"
		, "objects"
	]
	, spriteSizes: {
		tiles: 8
		, walls: 8
		, objects: 8
		, mobs: 8
		, characters: 8

		, animBigObjects: 24
		, animBoss: 24
		, bigObjects: 24
		, bosses: 24
		, auras: 24
	}
	, blockingTileIndices: [
		6, 7, 102, 374, 154, 189
	]
	, tileOpacities: {
		default: {
			default: 0.4
			, max: 1
		}
		, tiles: {
			default: 0.6
			, max: 0.75
			, 5: 0.7
			, 6: 0.9
			, 23: 0.9
			, 24: 0.9
			, 25: 0.9
			, 53: 0.7
			, 54: 0.5
			, 60: 0.9
			, 61: 0.9
			, 62: 0.75
			, 76: 0.9
			, 102: 0.9
			, 152: 0.9
			, 163: 0.9
			//snow
			, 176: 0.55
			, 184: 0.55
			, 185: 0.55
		}
		, objects: {
			default: 0.9
			, 50: 1
		}
		, walls: {
			default: 0.85
			, max: 1
			, 84: 1
			, 103: 0.9
			, 107: 0.9
			, 116: 1
			, 120: 0.9
			, 132: 0.9
			, 133: 0.9
			, 134: 0.85
			, 139: 1
			, 148: 1
			, 150: 0.85
			, 156: 1
			, 157: 1
			, 158: 1
			, 159: 1
			, 160: 0.9
			, 161: 1
			, 162: 1
			, 163: 1
			, 164: 0.8
			, 165: 1
			, 166: 0.95
			, 167: 1
			, 168: 1
			, 169: 1
		}
	}
	, tilesNoFlip: {
		tiles: [
			//Stairs
			171, 179, 10, 11, 12, 13, 14, 15, 26, 27, 28, 29, 42, 43, 44, 45, 46, 47, 58, 59, 60, 61, 62, 63, 74, 75, 76, 77, 78, 79, 90, 91, 91, 93, 94, 95, 111
		]
		, walls: [
			37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
			//Ledges
			, 156, 158, 162, 163, 167, 168
			//Wall Sign
			, 189
			//Stone Ledges
			, 195, 196, 197, 198, 199, 200, 201, 202, 203
			//Ship Edges
			, 204, 205, 206, 207, 214, 215, 220, 221, 222, 223
			//Gray wall sides and corners
			, 230, 231, 238, 239
			//other walls
			, 241, 242, 243, 244
		]
		, objects: [
			//Clotheslines
			96, 101
			//Table Sides
			, 103, 110, 118, 126
			//Wall-mounted plants
			, 120, 121
			//Ship oars
			, 140, 143
			//Ship Cannons
			, 141, 142
			//Tent Pegs
			, 168, 169
		]
	}
	, uiLoginList: [
		"login"
		, "announcements"
	]
	, uiList: [
		"inventory"
		, "equipment"
		, "hud"
		, "target"
		, "menu"
		, "spells"
		, "messages"
		, "online"
		, "mainMenu"
		, "context"
		, "party"
		, "help"
		, "dialogue"
		, "effects"
		, "tooltips"
		, "tooltipInfo"
		, "tooltipItem"
		, "quests"
		, "events"
		, "progressBar"
		, "stash"
		, "talk"
		, "trade"
		, "overlay"
		, "online"
		, "death"
		, "leaderboard"
		, "reputation"
		, "wardrobe"
		, "passives"
		, "workbench"
		, "middleHud"
		, "options"
		, "announcements"
	]
	, contextMenuActions: {
		player: []
		, npc: []
	}
	, clientComponents: []
	, sounds: {
		ui: []
	}
	, tos
};

module.exports = {
	config

	, init: async function () {
		fileLister.getFolder("./clientComponents").forEach((f) => {
			if (!f.endsWith(".js")) {
				return;
			}

			const type = f.split(".")[0];
			const path = "server/clientComponents/" + f;

			config.clientComponents.push({
				type
				, path
			});
		});

		config.clientComponents.push({
			extends: "effects"
			, path: "server/clientComponents/effects/auras.js"
		});

		events.emit("onBeforeGetClientConfig", config);

		//Deprecated
		events.emit("onBeforeGetResourceList", config.resourceList);
		events.emit("onBeforeGetUiList", config.uiList);
		events.emit("onBeforeGetContextMenuActions", config.contextMenuActions);
		events.emit("onBeforeGetTermsOfService", config.tos);
		events.emit("onBeforeGetTextureList", config.textureList);

		await this.calculateAtlasTextureDimensions();
	}

	//The client needs to know this as well as the map loader
	, calculateAtlasTextureDimensions: async function () {
		const { atlasTextures, atlasTextureDimensions } = config;

		for (const tex of atlasTextures) {
			if (atlasTextureDimensions[tex]) {
				return;
			}

			const path = tex.includes(".png") ? `../${tex}` : `../client/images/${tex}.png`;
			const dimensions = await imageSize(path);

			delete dimensions.type;
			atlasTextureDimensions[tex] = dimensions;
		}
	}

	, getTileIndexInAtlas: async function (spriteSheet, tileIndexInSource) {
		const { atlasTextures, atlasTextureDimensions } = config;

		//We need to perform this check because once mods start adding sheets to atlasTextures,
		// things get out of control. We need to fix this in the future as it will become screwy.
		if (Object.keys(atlasTextureDimensions).length !== atlasTextures) {
			await this.calculateAtlasTextureDimensions();
		}

		const indexOfSheet = atlasTextures.indexOf(spriteSheet);

		let tileCountBeforeSheet = 0;
		for (let i = 0; i < indexOfSheet; i++) {
			const sheet = atlasTextures[i];
			const { width, height } = atlasTextureDimensions[sheet];

			const spSize = config.spriteSizes[sheet] || 8;
			tileCountBeforeSheet += ((width / spSize) * (height / spSize));
		}

		//Tile index 0 is 'no tile' in map files so we need to increment by 1
		return tileCountBeforeSheet + tileIndexInSource + 1;
	}

	, getTileIndexInAtlasSync: function (spriteSheet, tileIndexInSource) {
		const { atlasTextures, atlasTextureDimensions } = config;

		const indexOfSheet = atlasTextures.indexOf(spriteSheet);

		let tileCountBeforeSheet = 0;

		for (let i = 0; i < indexOfSheet; i++) {
			const sheet = atlasTextures[i];
			const { width, height } = atlasTextureDimensions[sheet];

			const spSize = config.spriteSizes[sheet] || 8;
			tileCountBeforeSheet += ((width / spSize) * (height / spSize));
		}

		//Tile index 0 is 'no tile' in map files so we need to increment by 1
		return tileCountBeforeSheet + tileIndexInSource + 1;
	}

	//Used to send to clients
	, getClientConfig: function (msg) {
		msg.callback(config);
	}
};
