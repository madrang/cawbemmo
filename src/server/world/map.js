let objects = require('../objects/objects');
let physics = require('./physics');
let spawners = require('./spawners');
let resourceSpawner = require('./resourceSpawner');
let globalZone = require('../config/zoneBase');
let randomMap = require('./randomMap/randomMap');
const generateMappings = require('./randomMap/generateMappings');
let events = require('../misc/events');

const mapObjects = require('./map/mapObjects');
const canPathFromPos = require('./map/canPathFromPos');

let mapFile = null;
let mapScale = null;
let padding = null;

const objectifyProperties = oldProperties => {
	if (!oldProperties || !oldProperties.push)
		return oldProperties || {};

	let newProperties = {};
	oldProperties.forEach(p => {
		newProperties[p.name] = p.value;
	});
			
	return newProperties;
};

module.exports = {
	name: null,
	path: null,
	layers: [],

	mapFile: null,

	//The size of the base map, before mods are applied
	originalSize: {
		w: 0,
		h: 0
	},
	//The size of the map after mods are applied
	size: {
		w: 0,
		h: 0
	},

	custom: null,

	collisionMap: null,

	clientMap: null,
	oldLayers: {
		tiles: null,
		walls: null,
		doodads: null
	},

	objBlueprints: [],

	spawn: {
		x: 0,
		y: 0
	},

	rooms: [],
	hiddenRooms: [],

	hiddenWalls: null,
	hiddenTiles: null,

	zone: null,

	init: function (args) {
		this.name = args.name;
		this.path = args.path;
		
		try {
			this.zone = require('../' + this.path + '/' + this.name + '/zone');
		} catch (e) {
			this.zone = globalZone;
		}
		events.emit('onAfterGetZone', this.name, this.zone);

		let chats = null;
		try {
			chats = require('../' + this.path + '/' + this.name + '/chats');
		} catch (e) {}
		if (chats)
			this.zone.chats = chats;

		let dialogues = null;
		try {
			dialogues = require('../' + this.path + '/' + this.name + '/dialogues');
		} catch (e) {}
		events.emit('onBeforeGetDialogue', this.name, dialogues);
		if (dialogues)
			this.zone.dialogues = dialogues;

		this.zone = extend({}, globalZone, this.zone);

		let resources = this.zone.resources || {};
		for (let r in resources)
			resourceSpawner.register(r, resources[r]);

		mapFile = require('../' + this.path + '/' + this.name + '/map');
		this.mapFile = mapFile;
		//Fix for newer versions of Tiled
		this.mapFile.properties = objectifyProperties(this.mapFile.properties);

		mapScale = mapFile.tilesets[0].tileheight;

		this.custom = mapFile.properties.custom;

		if (mapFile.properties.spawn) {
			this.spawn = JSON.parse(mapFile.properties.spawn);
			if (!this.spawn.push)
				this.spawn = [this.spawn];
		}
	},
	create: function () {
		this.getMapFile();

		this.clientMap = {
			zoneId: -1,
			map: this.layers,
			collisionMap: this.collisionMap,
			clientObjects: this.objBlueprints,
			padding: padding,
			hiddenRooms: this.hiddenRooms
		};
	},

	getMapFile: function () {
		this.build();

		this.randomMap = extend({}, randomMap);
		this.oldMap = extend([], this.layers);

		this.randomMap.templates = extend([], this.rooms);
		generateMappings(this.randomMap, this);

		if (!mapFile.properties.isRandom) {
			for (let i = 0; i < this.size.w; i++) {
				let row = this.layers[i];
				for (let j = 0; j < this.size.h; j++) {
					let cell = row[j];
					if (!cell)
						continue;

					cell = cell.split(',');
					let cLen = cell.length;

					let newCell = '';
					for (let k = 0; k < cLen; k++) {
						let c = cell[k];
						let newC = this.randomMap.randomizeTile(c);
						newCell += newC;

						//Wall?
						if ((c >= 160) && (c <= 352) && (newC === 0))
							this.collisionMap[i][j] = 0;

						if (k < cLen - 1)
							newCell += ',';
					}

					let fakeContents = [];
					const hiddenWall = this.hiddenWalls[i][j];
					const hiddenTile = this.hiddenTiles[i][j];

					if (hiddenTile)
						fakeContents.push(-this.randomMap.randomizeTile(hiddenTile));
					if (hiddenWall)
						fakeContents.push(-this.randomMap.randomizeTile(hiddenWall));

					if (fakeContents.length)
						newCell += ',' + fakeContents.join(',');

					row[j] = newCell;
				}
			}
		}

		//Fix for newer versions of Tiled
		this.randomMap.templates
			.forEach(r => {
				r.properties = objectifyProperties(r.properties); 
			});

		this.randomMap.templates
			.filter(r => r.properties.mapping)
			.forEach(function (m) {
				let x = m.x;
				let y = m.y;
				let w = m.width;
				let h = m.height;

				for (let i = x; i < x + w; i++) {
					let row = this.layers[i];

					for (let j = y; j < y + h; j++)
						row[j] = '';
				}
			}, this);

		physics.init(this.collisionMap);

		padding = mapFile.properties.padding;

		mapFile = null;
	},

	build: function () {
		const mapSize = {
			w: mapFile.width,
			h: mapFile.height
		};

		this.originalSize = {
			w: mapFile.width,
			h: mapFile.height
		};

		events.emit('onBeforeGetMapSize', this.name, mapSize);

		this.size.w = mapSize.w;
		this.size.h = mapSize.h;

		const { w: oldW, h: oldH } = this.originalSize;
		const { w, h } = this.size;

		this.layers = _.get2dArray(w, h, null);
		this.hiddenWalls = _.get2dArray(w, h, null);
		this.hiddenTiles = _.get2dArray(w, h, null);

		this.oldLayers.tiles = _.get2dArray(w, h, 0);
		this.oldLayers.walls = _.get2dArray(w, h, 0);
		this.oldLayers.objects = _.get2dArray(w, h, 0);

		let builders = {
			tile: this.builders.tile.bind(this),
			object: this.builders.object.bind(this)
		};

		this.collisionMap = _.get2dArray(w, h);

		//Rooms need to be ahead of exits
		mapFile.layers.rooms = (mapFile.layers.rooms || [])
			.sort(function (a, b) {
				if ((a.exit) && (!b.exit))
					return 1;
				return 0;
			});

		for (let i = 0; i < mapFile.layers.length; i++) {
			let layer = mapFile.layers[i];
			let layerName = layer.name;
			if (!layer.visible)
				continue;

			let data = layer.data || layer.objects;
			if (layer.objects) {
				let info = {
					map: this.name,
					layer: layerName,
					objects: data,
					mapScale
				};
				events.emit('onAfterGetLayerObjects', info);
			}

			if (layer.objects) {
				let len = data.length;
				for (let j = 0; j < len; j++) {
					let cell = data[j];

					builders.object(layerName, cell, j);
				}
			} else {
				for (let x = 0; x < w; x++) {
					for (let y = 0; y < h; y++) {
						let index = (y * oldW) + x;

						const info = {
							map: this.name,
							layer: layerName,
							cell: 0,
							x,
							y
						};
						if (x < oldW && y < oldH)
							info.cell = data[index];

						events.emit('onBeforeBuildLayerTile', info);
						builders.tile(info);
					}
				}
			}
		}
	},

	getOffsetCellPos: function (sheetName, cell) {
		const { atlasTextureDimensions, config: { atlasTextures } } = clientConfig;
		const indexInAtlas = atlasTextures.indexOf(sheetName);

		let offset = 0;
		for (let i = 0; i < indexInAtlas; i++) {
			const dimensions = atlasTextureDimensions[atlasTextures[i]];

			offset += (dimensions.width / 8) * (dimensions.height / 8);
		}

		return cell + offset;
	},

	getCellInfo: function (gid, x, y) {
		const cellInfoMsg = {
			mapName: this.name,
			x,
			y,
			tilesets: mapFile.tilesets
		};
		events.emit('onBeforeGetCellInfo', cellInfoMsg);

		const tilesets = cellInfoMsg.tilesets;

		let flipX = null;

		if ((gid ^ 0x80000000) > 0) {
			flipX = true;
			gid = gid ^ 0x80000000;
		}

		let firstGid = 0;
		let sheetName = null;
		for (let s = 0; s < tilesets.length; s++) {
			let tileset = tilesets[s];
			if (tileset.firstgid <= gid) {
				sheetName = tileset.name;
				firstGid = tileset.firstgid;
			}
		}

		gid = gid - firstGid + 1;

		return {
			cell: gid,
			sheetName,
			flipX
		};
	},

	builders: {
		tile: function (info) {
			let { x, y, cell, layer: layerName } = info;

			if (cell === 0) {
				if (layerName === 'tiles')
					this.collisionMap[x][y] = 1;

				return;
			}

			let cellInfo = this.getCellInfo(cell, x, y);
			let sheetName = cellInfo.sheetName;

			const offsetCell = this.getOffsetCellPos(sheetName, cellInfo.cell);

			if ((layerName !== 'hiddenWalls') && (layerName !== 'hiddenTiles')) {
				let layer = this.layers;
				if (this.oldLayers[layerName])
					this.oldLayers[layerName][x][y] = offsetCell;
				layer[x][y] = (layer[x][y] === null) ? offsetCell : layer[x][y] + ',' + offsetCell;
			} else if (layerName === 'hiddenWalls')
				this.hiddenWalls[x][y] = offsetCell;
			else if (layerName === 'hiddenTiles')
				this.hiddenTiles[x][y] = offsetCell;

			if (layerName.indexOf('walls') > -1)
				this.collisionMap[x][y] = 1;
			else if (layerName === 'tiles' && sheetName === 'tiles') {
				//Check for water and water-like tiles
				if ([6, 7, 54, 55, 62, 63, 154, 189, 190, 192, 193, 194, 195, 196, 197].includes(offsetCell))
					this.collisionMap[x][y] = 1;
			}
		},

		object: function (layerName, cell) {
			//Fixes for newer versions of tiled
			cell.properties = objectifyProperties(cell.properties);
			cell.polyline = cell.polyline || cell.polygon;

			const x = cell.x / mapScale;
			const y = (cell.y / mapScale) - 1;

			let clientObj = (layerName === 'clientObjects');
			let cellInfo = this.getCellInfo(cell.gid, x, y);

			let name = (cell.name || '');
			let objZoneName = name;
			if (name.indexOf('|') > -1) {
				let split = name.split('|');
				name = split[0];
				objZoneName = split[1];
			}

			let blueprint = {
				clientObj: clientObj,
				sheetName: cell.has('sheetName') ? cell.sheetName : cellInfo.sheetName,
				cell: cell.has('cell') ? cell.cell : cellInfo.cell - 1,
				x,
				y,
				name: name,
				properties: cell.properties || {},
				layerName: layerName
			};

			if (objZoneName !== name)
				blueprint.objZoneName = objZoneName;

			if (this.zone) {
				if ((this.zone.objects) && (this.zone.objects[objZoneName.toLowerCase()]))
					extend(blueprint, this.zone.objects[objZoneName.toLowerCase()]);
				else if ((this.zone.objects) && (this.zone.mobs[objZoneName.toLowerCase()]))
					extend(blueprint, this.zone.mobs[objZoneName.toLowerCase()]);
			}

			if (blueprint.blocking)
				this.collisionMap[blueprint.x][blueprint.y] = 1;

			if ((blueprint.properties.cpnNotice) || (blueprint.properties.cpnLightPatch) || (layerName === 'rooms') || (layerName === 'hiddenRooms')) {
				blueprint.y++;
				blueprint.width = cell.width / mapScale;
				blueprint.height = cell.height / mapScale;
			} else if (cell.width === 24)
				blueprint.x++;

			if (cell.polyline) 
				mapObjects.polyline(this.size, blueprint, cell, mapScale);

			if (layerName === 'rooms') {
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
				} else if (blueprint.properties.resource) 
					resourceSpawner.register(blueprint.properties.resource, blueprint);
				else {
					blueprint.exits = [];
					blueprint.objects = [];
					this.rooms.push(blueprint);
				}
			} else if (layerName === 'hiddenRooms') {
				blueprint.fog = (cell.properties || {}).fog;
				blueprint.discoverable = (cell.properties || {}).discoverable;

				if (!mapFile.properties.isRandom)
					this.hiddenRooms.push(blueprint);
				else {
					let room = this.rooms.find(r => {
						return !(
							blueprint.x < r.x ||
							blueprint.y < r.y ||
							blueprint.x >= r.x + r.width ||
							blueprint.y >= r.y + r.height
						);
					});

					room.objects.push(blueprint);
				}
			} else if (!clientObj) {
				if (!mapFile.properties.isRandom)
					spawners.register(blueprint, blueprint.spawnCd || mapFile.properties.spawnCd);
				else {
					let room = this.rooms.find(r => {
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
				if ((cell.width) && (!cell.polyline)) {
					blueprint.width = cell.width / mapScale;
					blueprint.height = cell.height / mapScale;
				}

				let obj = objects.buildObjects([blueprint], true).getSimple(true);
				this.objBlueprints.push(obj);
			}
		}
	},

	getSpawnPos: function (obj) {
		let stats = obj.components.find(c => (c.type === 'stats'));
		let level = stats.values.level;

		let spawns = this.spawn.filter(s => (((s.maxLevel) && (s.maxLevel >= level)) || (!s.maxLevel)));
		return spawns[0];
	},

	//Find if any spawns can path to a position. This is important for when maps change and players 
	// log in on tiles that aren't blocking but not able to reach anywhere useful
	canPathFromPos: function (pos) {
		return canPathFromPos(this, pos);
	}
};
