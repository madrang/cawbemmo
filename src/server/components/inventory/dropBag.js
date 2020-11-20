let generator = require('../../items/generator');

module.exports = (cpnInv, ownerName, killSource) => {
	if (!cpnInv.blueprint)
		return;

	const obj = cpnInv.obj;

	//Only drop loot if this player is in the zone
	let playerObject = obj.instance.objects.find(o => o.player && o.name === ownerName);
	if (!playerObject)
		return;

	let items = cpnInv.items;
	let iLen = items.length;
	for (let i = 0; i < iLen; i++) {
		delete items[i].eq;
		delete items[i].pos;
	}

	let blueprint = cpnInv.blueprint;
	let magicFind = (blueprint.magicFind || 0);

	let savedItems = extend([], cpnInv.items);
	cpnInv.items = [];

	let dropEvent = {
		chanceMultiplier: 1,
		source: obj
	};
	playerObject.fireEvent('beforeGenerateLoot', dropEvent);

	if ((!blueprint.noRandom) || (blueprint.alsoRandom)) {
		let bonusMagicFind = killSource.stats.values.magicFind;

		let rolls = blueprint.rolls;
		let itemQuantity = Math.min(200, killSource.stats.values.itemQuantity);
		rolls += ~~(itemQuantity / 100);
		if ((Math.random() * 100) < (itemQuantity % 100))
			rolls++;

		for (let i = 0; i < rolls; i++) {
			if (Math.random() * 100 >= (blueprint.chance || 35) * dropEvent.chanceMultiplier)
				continue;

			let itemBlueprint = {
				level: obj.stats.values.level,
				magicFind: magicFind,
				bonusMagicFind: bonusMagicFind,
				noCurrency: i > 0
			};

			let useItem = generator.generate(itemBlueprint, playerObject.stats.values.level);
			cpnInv.getItem(useItem);
		}
	}

	if (blueprint.noRandom) {
		let blueprints = blueprint.blueprints;
		for (let i = 0; i < blueprints.length; i++) {
			let drop = blueprints[i];
			if ((drop.maxLevel) && (drop.maxLevel < killSource.stats.values.level))
				continue;
			else if ((drop.chance) && (~~(Math.random() * 100) >= drop.chance * dropEvent.chanceMultiplier)) 
				continue;

			drop.level = drop.level || obj.stats.values.level;
			drop.magicFind = magicFind;

			let item = drop;
			if ((!item.quest) && (item.type !== 'key'))
				item = generator.generate(drop);

			if (!item.slot)
				delete item.level;

			cpnInv.getItem(item, true);
		}
	}

	playerObject.fireEvent('beforeTargetDeath', obj, cpnInv.items);

	obj.instance.eventEmitter.emit('onBeforeDropBag', obj, cpnInv.items, killSource);
	obj.fireEvent('onBeforeDropBag', cpnInv.items, killSource);

	if (cpnInv.items.length > 0)
		cpnInv.createBag(obj.x, obj.y, cpnInv.items, ownerName);

	cpnInv.items = savedItems;
};
