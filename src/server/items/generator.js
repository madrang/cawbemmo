const GENERATORS = {
	level: require('./generators/level')
	, quality: require('./generators/quality')
	, slots: require('./generators/slots')
	, types: require('./generators/types')
	, stats: require('./generators/stats')
	, names: require('./generators/names')
	, worth: require('./generators/worth')
	, quantity: require('./generators/quantity')
	, spellbook: require('./generators/spellbook')
	, currency: require('./generators/currency')
	, effects: require('./generators/effects')
	, attrRequire: require('./generators/attrRequire')
	, recipeBook: require('./generators/recipeBook')
}
const itemGenerators = [
	GENERATORS.level
	, GENERATORS.quality
	, GENERATORS.slots
	, GENERATORS.types
	, GENERATORS.stats
	, GENERATORS.names
	, GENERATORS.effects
	, GENERATORS.attrRequire
	, GENERATORS.worth
];
const materialGenerators = [
	GENERATORS.names
	, GENERATORS.quantity
];
const spellGenerators = [
	GENERATORS.level
	, GENERATORS.quality
	, GENERATORS.spellbook
	, GENERATORS.worth
];
const currencyGenerators = [
	GENERATORS.currency
	, GENERATORS.quantity
];
const recipeGenerators = [
	GENERATORS.names
	, GENERATORS.recipeBook
];
module.exports = {
	spellChance: 0.035,
	currencyChance: 0.035,

	generate: function (blueprint, ownerLevel) {
		const hadBlueprint = Boolean(blueprint);
		blueprint = blueprint || {};

		const dropChancesEvent = {
			blueprint,
			spellChance: this.spellChance,
			currencyChance: this.currencyChance
		};
		if (!blueprint.slot && !blueprint.type && !blueprint.spell) {
			global.instancer.instances[0].eventEmitter.emit('onBeforeGetDropChances', dropChancesEvent);
		}
		delete dropChancesEvent.blueprint;
		const beforeGenerateItemEvent = {
			blueprint,
			item: null,
			dropChances: dropChancesEvent
		};
		global.instancer.instances[0].eventEmitter.emit('beforeGenerateItem', beforeGenerateItemEvent);
		if (beforeGenerateItemEvent.item) {
			return beforeGenerateItemEvent.item;
		}

		let currencyChance = dropChancesEvent.currencyChance;
		if (blueprint.level) {
			//Idol droprate before level 5 is 0, after which it slowly increases and flattens out at level 15
			if (blueprint.level < 5) {
				currencyChance = 0;
			} else if (blueprint.level < 14) {
				currencyChance *= (blueprint.level - 4) / 11;
			}
			//If you kill a mob that's too low of a level, idols are much more rare
			if (ownerLevel && ownerLevel - blueprint.level > 4) {
				const levelDelta = ownerLevel - blueprint.level;
				currencyChance /= Math.pow(levelDelta - 3, 2);
			}
		}
		if (blueprint.noCurrency) {
			currencyChance = 0;
		}

		let isSpell = false;
		let isCurrency = false;
		if (!blueprint.slot && !blueprint.noSpell && !blueprint.material && !blueprint.type) {
			isSpell = blueprint.spell;
			isCurrency = blueprint.currency;
			if (!isCurrency && !isSpell && (!hadBlueprint || (!blueprint.type && !blueprint.slot && !blueprint.stats))) {
				isSpell = Math.random() < dropChancesEvent.spellChance;
				if (!isSpell) {
					isCurrency = Math.random() < currencyChance;
				}
			}
		}
		if (blueprint.isSpell) {
			isSpell = true;
		}

		const item = {};
		if (isSpell) {
			spellGenerators.forEach(g => g.generate(item, blueprint));
		} else if (isCurrency) {
			currencyGenerators.forEach(g => g.generate(item, blueprint));
		} else if (blueprint.material) {
			item.material = true;
			item.sprite = blueprint.sprite || null;
			item.noDrop = blueprint.noDrop || null;
			item.noSalvage = blueprint.noSalvage || null;
			item.noDestroy = blueprint.noDestroy || null;
			item.quality = blueprint.quality || 0;
			materialGenerators.forEach(g => g.generate(item, blueprint));
		} else if (blueprint.type === 'mtx' || blueprint.type === 'toy') {
			//TODO: MTXs have been moved to a mod so we shouldn't have this any more
			item = extend({}, blueprint);
			delete item.chance;
		} else if (blueprint.type === 'recipe') {
			recipeGenerators.forEach(g => g.generate(item, blueprint));
		} else {
			itemGenerators.forEach(g => g.generate(item, blueprint));
			if (blueprint.spellName) {
				GENERATORS.spellbook.generate(item, blueprint);
			}
		}
		if (blueprint.spritesheet) {
			item.spritesheet = blueprint.spritesheet;
		}
		if (blueprint.noSalvage) {
			item.noSalvage = true;
		}
		if (blueprint.uses) {
			item.uses = blueprint.uses;
		}
		if (blueprint.description) {
			item.description = blueprint.description;
		}
		return item;
	},

	removeStat: function (item, stat) {
		if (!stat) {
			stat = Object.keys(item.stats).filter(s => (s !== 'armor'));
			stat = stat[Math.floor(Math.random() * stat.length)];
		}
		delete item.stats[stat];
		if (stat === 'lvlRequire') {
			item.level = item.originalLevel;
			delete item.originalLevel;
		}
	},

	pickRandomSlot: function () {
		let item = {};
		let blueprint = {};
		GENERATORS.slots.generate(item, blueprint);
		return item.slot;
	}
};
