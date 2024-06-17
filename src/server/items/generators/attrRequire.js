let generatorStats = require("./stats");

module.exports = {
	minSlotPerfection: 0.1
	, maxSlotPerfection: 0.75
	, minLevelMult: 0.3
	, maxLevelMult: 0.7

	, generate: function (item, blueprint) {
		if (!blueprint.attrRequire || item.level <= 5) {
			return;
		}
		if (!item.requires) {
			item.requires = [];
		}
		let tempItem = {
			quality: 0
			, level: item.level
			, stats: {}
		};

		let perfection = Math.floor(11 * (this.minSlotPerfection + (Math.random() * (this.maxSlotPerfection - this.minSlotPerfection))));
		generatorStats.generate(tempItem, {
			forceStats: [blueprint.attrRequire]
			, perfection: perfection
		});

		let statValue = tempItem.stats[Object.keys(tempItem.stats)[0]];
		statValue += Math.floor(item.level * (this.minLevelMult + Math.floor(Math.random() * (this.maxLevelMult - this.minLevelMult))));
		statValue = Math.ceil(((item.level - 1) / consts.maxLevel) * statValue);
		if (statValue <= 0) {
			item.requires = null;
			return;
		}

		item.requires.push({
			stat: blueprint.attrRequire
			, value: statValue
		});
	}
};
