let objects = require("../objects/objects");
let physics = require("./physics");
let spawners = require("./spawners");
let resourceSpawner = require("./resourceSpawner");
let globalZone = require("../config/zoneBase");
let randomMap = require("./randomMap/randomMap");
const generateMappings = require("./randomMap/generateMappings");
let events = require("../misc/events");

const mapObjects = require("./map/mapObjects");
const canPathFromPos = require("./map/canPathFromPos");

let mapFile = null;
let mapScale = null;
let padding = null;

const objectifyProperties = (oldProperties) => {
	if (!oldProperties || !Array.isArray(oldProperties)) {
		return oldProperties || {};
	}
	const newProperties = {};
	for (const { name, value } of oldProperties) {
		newProperties[name] = value;
	}
	return newProperties;
};

module.exports = {
	name: null
	, path: null
	, layers: []

	, mapFile: null

	//The size of the base map, before mods are applied
	, originalSize: {
		w: 0
		, h: 0
	}
	//The size of the map after mods are applied
	, size: {
		w: 0
		, h: 0
	}

	, custom: null

	, collisionMap: null

	, clientMap: null
	, oldLayers: {
		tiles: null
		, walls: null
		, doodads: null
	}

	, objBlueprints: []

	, spawn: { x: 0, y: 0 }

	, rooms: []
	, hiddenRooms: []

	, hiddenWalls: null
	, hiddenTiles: null

	, zoneConfig: null

	, init: function ({ zoneName, path }) {
		this.name = zoneName;
		this.path = path;

		this.zoneConfig = _.safeRequire(module, `../${this.path}/${this.name}/zone`) || globalZone;
		events.emit("onAfterGetZone", this.name, this.zoneConfig);

		const chats = _.safeRequire(module, `../${this.path}/${this.name}/chats`);
		if (chats) {
			if (this.zoneConfig.chats) {
				_.assign(this.zoneConfig.chats, chats);
			} else {
				this.zoneConfig.chats = chats;
			}
		}

		const dialogues = _.safeRequire(module, `../${this.path}/${this.name}/dialogues`);
		events.emit("onBeforeGetDialogue", this.name, dialogues);
		if (dialogues) {
			this.zoneConfig.dialogues = dialogues;
		}

		this.zoneConfig = _.assign({}, globalZone, this.zoneConfig);

		const resources = this.zoneConfig.resources || {};
		for (let r in resources) {
			resourceSpawner.register(r, resources[r]);
		}

		mapFile = require(`../${this.path}/${this.name}/map`);
		this.mapFile = mapFile;
		//Fix for newer versions of Tiled
		this.mapFile.properties = objectifyProperties(this.mapFile.properties);

		mapScale = mapFile.tilesets[0].tileheight;

		this.custom = mapFile.properties.custom;

		if (mapFile.properties.spawn) {
			this.spawn = JSON.parse(mapFile.properties.spawn);
			if (!this.spawn.push) {
				this.spawn = [this.spawn];
			}
		}
	}

	, create: function () {
		this.getMapFile();

		this.clientMap = {
			zoneId: -1
			, map: this.layers
			, collisionMap: this.collisionMap
			, clientObjects: this.objBlueprints
			, padding: padding
			, hiddenRooms: this.hiddenRooms
		};
	}

	, getMapFile: function () {
		this.build();

		this.randomMap = _.assign({}, randomMap);
		this.oldMap = _.assign([], this.layers);

		this.randomMap.templates = _.assign([], this.rooms);
		generateMappings(this.randomMap, this);

		if (!mapFile.properties.isRandom) {
			for (let i = 0; i < this.size.w; i++) {
				let row = this.layers[i];
				for (let j = 0; j < this.size.h; j++) {
					let cell = row[j];
					if (!cell) {
						continue;
					}
					cell = cell.split(",");
					let cLen = cell.length;

					let newCell = "";
					for (let k = 0; k < cLen; k++) {
						let c = cell[k];
						let newC = c;

						//Randomize tile
						const msgBeforeRandomizePosition = {
							success: true
							, x: i
							, y: j
							, map: this.name
						};
						events.emit("onBeforeRandomizePosition", msgBeforeRandomizePosition);
						if (msgBeforeRandomizePosition.success) {
							newC = this.randomMap.randomizeTile(c);
						}
						newCell += newC;

						//Wall?
						if ((c >= 160) && (c <= 352) && (newC === 0)) {
							this.collisionMap[i][j] = 0;
						}
						if (k < cLen - 1) {
							newCell += ",";
						}
					}

					const fakeContents = [];
					const hiddenTile = this.hiddenTiles[i][j];
					if (hiddenTile) {
						fakeContents.push(-this.randomMap.randomizeTile(hiddenTile));
					}
					const hiddenWall = this.hiddenWalls[i][j];
					if (hiddenWall) {
						fakeContents.push(-this.randomMap.randomizeTile(hiddenWall));
					}
					if (fakeContents.length) {
						newCell += "," + fakeContents.join(",");
					}
					row[j] = newCell;
				}
			}
		}

		for (const r of this.randomMap.templates) {
			//Fix for newer versions of Tiled
			r.properties = objectifyProperties(r.properties);

			//TODO - Seems like Incomplete code from previous repo ????
			const m = r.properties.mapping;
			if (!m) {
				continue;
			}
			for (let i = m.x; i < m.x + m.width; i++) {
				const row = this.layers[i];
				for (let j = m.y; j < m.y + m.height; j++) {
					row[j] = "";
				}
			}
		}
		physics.init(this.collisionMap);
		padding = mapFile.properties.padding;
		mapFile = null;
	}

	, build: function () {
		const mapSize = {
			w: mapFile.width
			, h: mapFile.height
		};
		this.originalSize = {
			w: mapFile.width
			, h: mapFile.height
		};
		events.emit("onBeforeGetMapSize", this.name, mapSize);

		this.size.w = mapSize.w;
		this.size.h = mapSize.h;

		const { w: oldW, h: oldH } = this.originalSize;
		const { w, h } = this.size;

		this.layers = _.get2dArray(w, h, null);
		this.hiddenWalls = _.get2dArray(w, h, null);
		this.hiddenTiles = _.get2dArray(w, h, null);

		this.oldLayers.tiles = _.get2dArray(w, h, 0);
		this.oldLayers.walls = _.get2dArray(w, h, 0);
		this.oldLayers.doodads = _.get2dArray(w, h, 0);

		let builders = {
			tile: this.builders.tile.bind(this)
			, object: this.builders.object.bind(this)
		};

		this.collisionMap = _.get2dArray(w, h);

		const layers = [...mapFile.layers.filter((l) => l.objects), ...mapFile.layers.filter((l) => !l.objects)];

		//Rooms need to be ahead of exits
		const layerRooms = layers.find((l) => l.name === "rooms") || {};
		layerRooms.objects.sort((a, b) => {
			const isExitA = a?.properties?.some((p) => p.name === "exit");
			const isExitB = b?.properties?.some((p) => p.name === "exit");
			if (isExitA && !isExitB) {
				return 1;
			} else if (!isExitA && isExitB) {
				return -1;
			}
			return 0;
		});

		for (let layer of layers) {
			const layerName = layer.name;
			if (!layer.visible) {
				continue;
			}
			const data = layer.data || layer.objects;
			if (layer.objects) {
				events.emit("onAfterGetLayerObjects", {
					map: this.name
					, layer: layerName
					, objects: data
					, mapScale
					, size: this.size
				});
				const len = data.length;
				for (let j = 0; j < len; j++) {
					const cell = data[j];
					builders.object(layerName, cell, j);
				}
			} else {
				for (let x = 0; x < w; x++) {
					for (let y = 0; y < h; y++) {
						const msgBuild = {
							map: this.name
							, layer: layerName
							, sheetName: null
							, cell: 0
							, x, y
						};
						if (x < oldW && y < oldH) {
							msgBuild.cell = data[(y * oldW) + x];
						}
						events.emit("onBeforeBuildLayerTile", msgBuild);
						builders.tile(msgBuild);
						events.emit("onAfterBuildLayerTile", msgBuild);
					}
				}
			}
		}
	}

	, getOffsetCellPos: function (sheetName, cell) {
		const { config: { atlasTextureDimensions, atlasTextures, spriteSizes } } = clientConfig;
		const indexInAtlas = atlasTextures.indexOf(sheetName);

		let offset = 0;
		for (let i = 0; i < indexInAtlas; i++) {
			const textureName = atlasTextures[i];
			const spriteSize = spriteSizes[textureName] || 8;
			const textureDimensions = atlasTextureDimensions[textureName];
			offset += (textureDimensions.width / spriteSize) * (textureDimensions.height / spriteSize);
		}
		return cell + offset;
	}

	, getCellInfo: function (gid, x, y, layerName) {
		const cellInfoMsg = {
			mapName: this.name
			, x
			, y
			, layerName
			, tilesets: mapFile.tilesets
			, sheetName: null
		};
		events.emit("onBeforeGetCellInfo", cellInfoMsg);

		let flipX = Boolean((gid & 0x80000000) !== 0);
		if (flipX) {
			gid = gid ^ 0x80000000;
		}
		let sheetName = cellInfoMsg.sheetName;
		if (!sheetName) {
			let firstGid = 0;
			for (let tileset of cellInfoMsg.tilesets) {
				if (tileset.firstgid <= firstGid || tileset.firstgid > gid) {
					continue;
				}
				sheetName = tileset.name;
				firstGid = tileset.firstgid;
			}
			gid = gid - firstGid + 1;
		}
		return {
			cell: gid
			, sheetName
			, flipX
		};
	}

	, builders: {
		tile: function (info) {
			let { x, y, cell, layer: layerName, sheetName } = info;
			if (cell === 0) {
				if (layerName === "tiles") {
					this.collisionMap[x][y] = 1;
				}
				return;
			}
			let cellInfo = this.getCellInfo(cell, x, y, layerName);
			if (!sheetName) {
				info.sheetName = cellInfo.sheetName;
				sheetName = cellInfo.sheetName;
			}
			const offsetCell = this.getOffsetCellPos(sheetName, cellInfo.cell);
			const isHiddenLayer = layerName.indexOf("hidden") === 0;
			if (isHiddenLayer) {
				this[layerName][x][y] = offsetCell;
			} else {
				if (this.oldLayers[layerName]) {
					this.oldLayers[layerName][x][y] = offsetCell;
				}
				this.layers[x][y] = ((this.layers[x][y] === null) ? offsetCell : `${this.layers[x][y]},${offsetCell}`);
				if (layerName.indexOf("walls") > -1 || clientConfig.config.blockingTileIndices.includes(offsetCell)) {
					this.collisionMap[x][y] = 1;
				}
			}
		}

		, object: function (layerName, cell) {
			//Fixes for newer versions of tiled
			cell.properties = objectifyProperties(cell.properties);
			cell.polyline = cell.polyline || cell.polygon;

			const x = Math.round(cell.x / mapScale);
			const y = Math.round(cell.y / mapScale) - 1;

			let clientObj = (layerName === "clientObjects");
			let cellInfo = this.getCellInfo(cell.gid, x, y, layerName);

			let name = (cell.name || "");
			let objZoneName = name;
			if (name.indexOf("|") > -1) {
				let split = name.split("|");
				name = split[0];
				objZoneName = split[1];
			}
			const blueprint = {
				id: cell.properties.id
				, clientObj: clientObj
				, sheetName: cell.has("sheetName") ? cell.sheetName : cellInfo.sheetName
				, cell: cell.has("cell") ? cell.cell : cellInfo.cell - 1
				, x, y
				, name: name
				, properties: cell.properties || {}
				, layerName: layerName
			};
			if (objZoneName !== name) {
				blueprint.objZoneName = objZoneName;
			}
			if (this.zoneConfig) {
				if ((this.zoneConfig.objects) && (this.zoneConfig.objects[objZoneName.toLowerCase()])) {
					_.assign(blueprint, this.zoneConfig.objects[objZoneName.toLowerCase()]);
				} else if ((this.zoneConfig.objects) && (this.zoneConfig.mobs[objZoneName.toLowerCase()])) {
					_.assign(blueprint, this.zoneConfig.mobs[objZoneName.toLowerCase()]);
				}
			}
			if (blueprint.blocking) {
				this.collisionMap[blueprint.x][blueprint.y] = 1;
			}
			if ((blueprint.properties.cpnNotice) || (blueprint.properties.cpnLightPatch) || (layerName === "rooms") || (layerName === "hiddenRooms")) {
				blueprint.y++;
				blueprint.width = cell.width / mapScale;
				blueprint.height = cell.height / mapScale;
			} else if (cell.width === 24) {
				blueprint.x++;
			}
			if (cell.polyline) {
				mapObjects.polyline(this.size, blueprint, cell, mapScale);
			}

			if (layerName === "rooms") {
				if (blueprint.properties.exit) {
					let room = this.rooms.find(function (r) {
						return (!(
							(blueprint.x + blueprint.width < r.x) ||
								(blueprint.y + blueprint.height < r.y) ||
								(blueprint.x >= r.x + r.width) ||
								(blueprint.y >= r.y + r.height)
						));
					});
					room.exits.push(blueprint);
				} else if (blueprint.properties.resource) {
					resourceSpawner.register(blueprint.properties.resource, blueprint);
				} else {
					blueprint.exits = [];
					blueprint.objects = [];
					this.rooms.push(blueprint);
				}
			} else if (layerName === "hiddenRooms") {
				blueprint.fog = cell.properties?.fog;
				blueprint.interior = cell.properties?.interior;
				blueprint.discoverable = cell.properties?.discoverable;
				blueprint.layer = Math.floor(cell.properties?.layer || 0);
				if (!mapFile.properties.isRandom) {
					this.hiddenRooms.push(blueprint);
				} else {
					const room = this.rooms.find((r) => {
						return !(
							blueprint.x < r.x || blueprint.y < r.y ||
							blueprint.x >= r.x + r.width || blueprint.y >= r.y + r.height
						);
					});
					room.objects.push(blueprint);
				}
			} else if (!clientObj) {
				if (!mapFile.properties.isRandom) {
					spawners.register(blueprint, blueprint.spawnCd || mapFile.properties.spawnCd);
				} else {
					const room = this.rooms.find((r) => {
						return !(
							blueprint.x < r.x ||
							blueprint.y < r.y ||
							blueprint.x >= r.x + r.width ||
							blueprint.y >= r.y + r.height
						);
					});
					room.objects.push(blueprint);
				}
			} else {
				if (cell.width && !cell.polyline) {
					blueprint.width = cell.width / mapScale;
					blueprint.height = cell.height / mapScale;
				}
				const obj = objects.buildObjects([blueprint], true).getSimple(true);
				this.objBlueprints.push(obj);
			}
		}
	}

	, getSpawnPos: function (obj) {
		let stats = obj.components.find((c) => (c.type === "stats"));
		let level = stats.values.level;

		let spawns = this.spawn.filter((s) => (((s.maxLevel) && (s.maxLevel >= level)) || (!s.maxLevel)));
		return spawns[0];
	}

	//Find if any spawns can path to a position. This is important for when maps change and players
	// log in on tiles that aren't blocking but not able to reach anywhere useful
	, canPathFromPos: function (pos) {
		return canPathFromPos(this, pos);
	}
};
