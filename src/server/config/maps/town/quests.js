module.exports = {
	infini: [{
		name: "Ramasseur de gogosse"
		, type: "loot"
		, subType: "slot"
		, quantity: 1
	}, {
		name: "Faire le ménage"
		, type: "killX"
		, subType: "mobType"
		, quantity: [5, 10]
	}, {
		name: "Trouvé $itemName$"
		, type: "lootGen"
		, subType: ""
		, quantity: [3, 7]
		, dropChance: 0.5
	}, {
		name: "Consomation personnel"
		, type: "gatherResource"
		, subType: "herb"
		, quantity: [2, 5]
	}]
};
