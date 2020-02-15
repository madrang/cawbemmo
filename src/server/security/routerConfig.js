let events = require('../misc/events');

const routerConfig = {
	allowed: {
		player: ['performAction', 'queueAction', 'move'],
		auth: ['login', 'register', 'play', 'getCharacterList', 'getCharacter', 'deleteCharacter', 'getSkinList', 'createCharacter', 'getCustomChannels'],
		social: ['chat', 'getInvite', 'acceptInvite', 'declineInvite', 'removeFromParty', 'leaveParty']
	},
	secondaryAllowed: {
		dialogue: ['talk'],
		gatherer: ['gather'],
		quests: ['complete'],
		inventory: ['combineStacks', 'splitStack', 'activateMtx', 'useItem', 'moveItem', 'enchantItem', 'getEnchantMaterials', 'learnAbility', 'unlearnAbility', 'dropItem', 'destroyItem', 'salvageItem', 'stashItem', 'mailItem', 'sortInventory'],
		equipment: ['equip', 'unequip', 'setQuickSlot', 'useQuickSlot', 'inspect'],
		stash: ['withdraw', 'open'],
		trade: ['buySell'],
		door: ['lock', 'unlock'],
		wardrobe: ['open', 'apply'],
		stats: ['respawn'],
		passives: ['tickNode', 'untickNode'],
		workbench: ['open', 'craft', 'getRecipe']
	},
	globalAllowed: {
		clientConfig: ['getClientConfig'],
		leaderboard: ['requestList'],
		cons: ['unzone']
	}
};

module.exports = {
	routerConfig,

	init: function () {
		events.emit('onBeforeGetRouterConfig', routerConfig);
	}
};