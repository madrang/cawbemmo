let events = require('../misc/events');

let config = {
	wizard: {
		name: 'Wizard',
		sprite: [0, 0],
		defaultSpirit: 'owl',
		default: true
	},
	thief: {
		name: 'Thief',
		sprite: [1, 0],
		defaultSpirit: 'lynx',
		default: true
	},
	warrior: {
		name: 'Warrior',
		sprite: [2, 0],
		defaultSpirit: 'bear',
		default: true
	},
	//Faction Skins
	'gaekatlan-druid': {
		name: 'Gaekatlan Druid',
		sprite: [0, 1]
	}
};

module.exports = {
	init: function () {
		events.emit('onBeforeGetSkins', config);
	},

	getBlueprint: function (skinId) {
		return config[skinId];
	},

	getSkinList: function (skins) {
		let list = Object.keys(config)
			.filter(function (s) {
				return ((config[s].default) || (skins.some(f => ((f === s) || (f === '*')))));
			})
			.map(function (s) {
				let res = extend({}, config[s]);
				res.id = s;
				return res;
			});

		let result = [];
		list.forEach(function (skin) {
			result.push({
				name: skin.name,
				id: skin.id,
				sprite: skin.sprite[0] + ',' + skin.sprite[1],
				spritesheet: skin.spritesheet,
				defaultSpirit: skin.defaultSpirit
			});
		}, this);

		return result;
	},

	getCell: function (skinId) {
		let skin = config[skinId] || config.wizard;
		return (skin.sprite[1] * 8) + skin.sprite[0];
	},

	getSpritesheet: function (skinId) {
		let skin = config[skinId] || config.wizard;
		return skin.spritesheet || 'characters';
	}
};
