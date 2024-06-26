let configTypes = require("../config/types");
let armorMaterials = require("../config/armorMaterials");

module.exports = {
	generate: function (item, blueprint) {
		let type = blueprint.type;

		if (!type || !configTypes.types[item.slot][type]) {
			//Pick a material type first
			const types = configTypes.types[item.slot];
			const typeArray = Object
				.entries(types)
				.filter((t) => t[1].noDrop !== true);

			const materials = Object.values(types)
				.map((t) => {
					return t.material;
				})
				.filter((m, i) => i === typeArray.findIndex((t) => t[1].material === m));

			const material = materials[Math.floor(Math.random() * materials.length)];

			const possibleTypes = {};

			Object.entries(types)
				.forEach((t) => {
					const [ typeName, typeConfig ] = t;

					if (typeConfig.material === material && typeConfig.noDrop !== true) {
						possibleTypes[typeName] = typeConfig;
					}
				});

			type = _.randomKey(possibleTypes);
		}

		let typeBlueprint = configTypes.types[item.slot][type] || {};

		if (!typeBlueprint) {
			return;
		}

		item.type = type;
		item.sprite = _.assign([], blueprint.sprite || typeBlueprint.sprite);
		if (typeBlueprint.spritesheet && !blueprint.spritesheet) {
			item.spritesheet = typeBlueprint.spritesheet;
		}

		if (typeBlueprint.spellName) {
			blueprint.spellName = typeBlueprint.spellName;
			blueprint.spellConfig = typeBlueprint.spellConfig;
		}

		if (typeBlueprint.range) {
			item.range = typeBlueprint.range;
		}

		if (typeBlueprint.material) {
			let material = armorMaterials[typeBlueprint.material];
			blueprint.attrRequire = material.attrRequire;
		}

		if (typeBlueprint.implicitStat && !blueprint.implicitStat) {
			blueprint.implicitStat = typeBlueprint.implicitStat;
		}

		if (typeBlueprint.attrRequire && !blueprint.attrRequire) {
			blueprint.attrRequire = typeBlueprint.attrRequire;
		}
	}
};
