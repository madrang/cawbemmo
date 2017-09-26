define([
	
], function(
	
) {
	return {
		name: 'Event: Halloween',

		mapOffset: {
			x: 10, 
			y: 82
		},

		extraScripts: [
			
		],

		mapFile: null,
		mapW: null,
		mapH: null,

		init: function() {
			this.mapFile = require.nodeRequire('../../../mods/event-halloween/maps/tutorial/map');
			this.mapW = this.mapFile.width;
			this.mapH = this.mapFile.height;

			this.events.on('onBeforeGetEventList', this.onBeforeGetEventList.bind(this));
			this.events.on('onBeforeGetQuests', this.onBeforeGetQuests.bind(this));
			this.events.on('onBeforeGetDialogue', this.onBeforeGetDialogue.bind(this));
			this.events.on('onAfterGetZone', this.onAfterGetZone.bind(this));
			this.events.on('onBeforeBuildLayerTile', this.onBeforeBuildLayerTile.bind(this));
			this.events.on('onAfterGetLayerObjects', this.onAfterGetLayerObjects.bind(this));
		},

		onAfterGetLayerObjects: function(info) {
			if (info.map != 'tutorial')
				return;

			var layer = this.mapFile.layers.find(l => (l.name == info.layer));
			if (layer) {
				var offset = this.mapOffset;
				var mapScale = this.mapFile.tilesets[0].tileheight;

				layer.objects.forEach(function(l) {
					var newO = extend(true, {}, l);
					newO.x += (offset.x * mapScale);
					newO.y += (offset.y * mapScale);

					info.objects.push(newO);
				}, this);
			}
		},

		onBeforeBuildLayerTile: function(info) {
			if (info.map != 'tutorial')
				return;

			var offset = this.mapOffset;

			var x = info.x;
			var y = info.y;

			if ((x - offset.x < 0) || (y - offset.y < 0) || (x - offset.x >= this.mapW) || (y - offset.y >= this.mapH))
				return;

			var i = ((y - offset.y) * this.mapW) + (x - offset.x);
			var layer = this.mapFile.layers.find(l => (l.name == info.layer));
			if (layer)
				info.cell = layer.data[i];
		},

		onBeforeGetEventList: function(zone, list) {
			list.push(this.relativeFolderName + '/maps/tutorial/events/halloween.js');
		},

		onAfterGetZone: function(zone, config) {
			try {
				var modZone = require(this.relativeFolderName + '/maps/' + zone + '/zone.js');
				extend(true, config, modZone);
			} catch (e) {
				
			}
		},

		onBeforeGetDialogue: function(zone, config) {
			try {
				var modDialogue = require(this.relativeFolderName + '/maps/' + zone + '/dialogue.js');
				extend(true, config, modDialogue);
			} catch (e) {
				
			}
		},

		onBeforeGetQuests: function(zone, config) {
			try {
				var modQuests = require(this.relativeFolderName + '/maps/' + zone + '/quests.js');
				extend(true, config, modQuests);
			} catch (e) {
				
			}
		}
	};
});