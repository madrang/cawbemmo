let configCurrencies = require("../config/currencies");

let chances = [];
for (let c in configCurrencies.chance) {
	let rolls = configCurrencies.chance[c];
	for (let i = 0; i < rolls; i++) {
		chances.push(c);
	}
}

module.exports = {
	generate: function (item, blueprint) {
		let pick = null;
		if (!blueprint.name) {
			pick = _.getRandomObj(chances);
		} else {
			pick = Object.keys(configCurrencies.currencies).find((c) => c.toLowerCase().includes(blueprint.name.toLowerCase()));
		}
		item.name = pick;
		_.assign(item, configCurrencies.currencies[pick]);
	}
};
