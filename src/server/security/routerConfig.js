let events = require('../misc/events');

const routerConfig = {
	//Component methods that can be called on the main thread
	allowed: {
		player: ['performAction', 'queueAction', 'move'],
		auth: ['login', 'register', 'play', 'getCharacterList', 'getCharacter', 'deleteCharacter', 'getSkinList', 'createCharacter', 'getCustomChannels'],
		social: ['chat', 'getInvite', 'acceptInvite', 'declineInvite', 'removeFromParty', 'leaveParty']
	},
	//Component methods that can be called with a targetId
	// which means that we're not calling our own component method but instead, another object's component method
	allowTargetId: {
		social: ['getInvite', 'acceptInvite', 'declineInvite']
	},
	//Component methods that can be called on map threads through `performAction` or `queueAction` methods
	secondaryAllowed: {
		dialogue: ['talk'],
		gatherer: ['gather'],
		quests: ['complete'],
		inventory: ['combineStacks', 'splitStack', 'useItem', 'moveItem', 'learnAbility', 'unlearnAbility', 'dropItem', 'destroyItem', 'salvageItem', 'stashItem', 'sortInventory'],
		equipment: ['equip', 'unequip', 'setQuickSlot', 'useQuickSlot', 'inspect'],
		stash: ['withdraw', 'open'],
		trade: ['buySell'],
		door: ['lock', 'unlock'],
		wardrobe: ['open', 'apply'],
		stats: ['respawn'],
		passives: ['tickNode', 'untickNode'],
		workbench: ['open', 'craft', 'getRecipe']
	},
	//Component methods that can be called on map threads with a targetId
	// which means that we're not calling our own component method but instead, another object's component method
	// These are called through `performAction` or `queueAction` methods
	secondaryAllowTargetId: {
		door: ['lock', 'unlock'],
		gatherer: ['gather'],
		equipment: ['inspect'],
		stash: ['open'],
		wardrobe: ['open', 'apply'],
		workbench: ['open', 'craft', 'getRecipe']
	},
	//Global module methods that can be called on the main thread or map threads
	globalAllowed: {
		clientConfig: ['getClientConfig'],
		leaderboard: ['requestList'],
		cons: ['unzone'],
		rezoneManager: ['clientAck'],
		instancer: ['clientAck']
	}
};

module.exports = {
	routerConfig,

	init: function () {
		events.emit('onBeforeGetRouterConfig', routerConfig);
	}
};
