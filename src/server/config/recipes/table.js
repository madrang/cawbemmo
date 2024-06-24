const baseRecipes = {
	joint: {
		description: "Un bon vieux joint"
		, item: {
			name: "Joint"
			, type: "consumable"
			, sprite: [0, 8]
			, description: "Un bon vieux joint pour ce heal"
			, worth: 5
			, noSalvage: true
			, noAugment: true
			, uses: 1
			, effects: [{
				type: "gainStat"
				, rolls: {
					stat: "hp"
				}
			}]
		}
		, materials: [{
			quantity: 1
		}, {
			name: "Papier a roulé"
			, quantity: 1
		}

		]
	}
	,djoint: {
		description: "Un deux papier"
		, item: {
			name: "Joint"
			, type: "consumable"
			, sprite: [0, 8]
			, description: "Un gros 2 papier pour la mana"
			, worth: 10
			, noSalvage: true
			, noAugment: true
			, uses: 1
			, effects: [{
				type: "gainStat"
				, rolls: {
					stat: "mp"
				}
			}]
		}
		, materials: [{
			quantity: 1
		}, {
			name: "Papier a roulé"
			, quantity: 2
		}

		]
	}
};

const buildRecipe = function (recipeName, itemName, effectAmount, materialName, quantity) {
	return extend({}, baseRecipes[recipeName], {
		name: itemName
		, item: {
			name: itemName
			, quantity: quantity
			, effects: [{
				rolls: {
					amount: effectAmount
				}
			}]
		}
		, materials: [{
			name: materialName
		}]
	});
};

module.exports = [
// 	(recette, "nom de l'objet", Effets, "ingrédients", Quantité crafté)
	buildRecipe("joint", "Un bon vieux joint", 50, "weed", 1)
	,	buildRecipe("djoint", "Un deux papier", 100, "weed", 1)
	// , buildRecipe("carp", "Big Carp on a Stick", 50, "Big Sun Carp", 2)
	// , buildRecipe("carp", "Giant Carp on a Stick", 150, "Giant Sun Carp", 1)
	// , buildRecipe("carp", "Trophy Carp on a Stick", 150, "Trophy Sun Carp", 2)
	// , buildRecipe("carp", "Fabled Carp on a Stick", 200, "Fabled Sun Carp", [3, 5])
];
