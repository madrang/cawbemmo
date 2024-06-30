const baseRecipes = {
	joint: {
		item: {
			name: "Joint"
			, type: "consumable"
			, sprite: [0, 8]
			, worth: 5
			, noSalvage: true
			, noAugment: true
			, uses: 1
			, effects: [{
				type: "gainStat"
			}]
		}
		, materials: [
			{
			name: "weed"
			, quantity: 1
			}
			,{
			name: "Papier a roulé"
			, quantity: 1
			}
		]
	}
};

const buildRecipe = function (recipe, item, materials, effects) {
	if (!recipe?.name) {
		throw new Error("Missing recipe name.")
	}
	if (!item?.name) {
		throw new Error("Missing item name.")
	}
	if (materials && !Array.isArray(materials)) {
		materials = [ materials ];
	}
	if (effects && !Array.isArray(effects)) {
		effects = [ effects ];
	}
	return _.assign({}, baseRecipes[recipe.name], recipe, {
		// New recipe name from the item name.
		name: item.name
		, item: _.assign(item, {
			effects: effects || []
		})
		, materials: materials || []
	});
};

module.exports = [
// 	(recette, "nom de l'objet", Effets, "ingrédients", Quantité crafté)
	buildRecipe(
		// recette
		{ name: "joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Hp instant"
		}
		// item
		,{ name: "Un bon vieux joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Hp instant"
		}
		// materials
		, undefined
		// effects
		, {
			rolls: {
				//stat: ( "mp" | "hp" )
				stat: "hp"
				// montant de base
				, amount: 10
			}
		}
	)
	, buildRecipe(
		// recette
		{ name: "joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Mana instant"
		}
		// item
		, { name: "Joint Deux papier"
			, description: "Un bon vieux joint pour ce donner de la mana<br /><br />Donne: 50 Mana instant"
		}
		// Materials
		, [ { name: "Papier a roulé", quantity: 2 }
			, { name: "weed", quantity: 2 }
		]
		, {
			rolls: {
				//stat: ( "mana" | "hp" )
				stat: "mana"
				// montant de base
				, amount: 50
			}
		}
	)
];
