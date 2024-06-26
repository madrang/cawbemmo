let configSlots = require("../config/slots");
let configTypes = require("../config/types");

let chances = [];
for (let c in configSlots.chance) {
	let rolls = configSlots.chance[c];
	for (let i = 0; i < rolls; i++) {
		chances.push(c);
	}
}

module.exports = {
	generate: function (item, blueprint) {
		if (blueprint.slot) {
			item.slot = blueprint.slot;
		} else if (blueprint.type) {
			item.slot = Object.keys(configTypes.types).find((c) => configTypes.types[c][blueprint.type]);
		}

		//If the slot doesn't exist or the type doesn't exist in the slot, pick a random type
		if (!item.slot || !configSlots.slots.includes(item.slot)) {
			item.slot = chances[Math.floor(Math.random() * chances.length)];
		}
	}
};
