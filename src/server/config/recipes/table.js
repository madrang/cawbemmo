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
    if (!recipe.name) {
        throw new Error("Missing recipe name.")
    }
    if (!item.name) {
        throw new Error("Missing item name.")
    }
    if (materials && !Array.isArray(materials)) {
        materials = [ materials ];
    }
    if (effects && !Array.isArray(effects)) {
        effects = [ effects ];
    }
    return extend({}, baseRecipes[recipe.name], recipe, {
        name: item.name
        , item: {
            effects: effects || []
        }
        , materials: materials || []
    });
};

module.exports = [
// 	(recette, "nom de l'objet", Effets, "ingrédients", Quantité crafté)
	buildRecipe({
		//recette
			name: "joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Hp instant"
		}
		,{
		//item
			name: "Un bon vieux joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Hp instant"
		}
		, undefined
		, {
			rolls: {
					stat: "hp"  //stat mp hp
					, amount: 10 // montant de base
				}
		})
	, buildRecipe({
		//recette
			name: "joint"
			, description: "Un bon vieux joint pour ce heal<br /><br />Donne: 50 Mana instant"
		}
		,{
		//item
			name: "Joint Deux papier"
			, description: "Un bon vieux joint pour ce donner de la mana<br /><br />Donne: 50 Mana instant"
		}
		,[{
	 		name: "Papier a roulé"
	 		, quantity: 2
			}
			, {
			name: "weed"
			, quantity: 2
			}
		], {
			rolls: {
					stat: "mana"  //stat mp hp
					, amount: 50  // montant de base
				}
		})


	// , buildRecipe("carp", "Big Carp on a Stick", 50, "Big Sun Carp", 2)
	// , buildRecipe("carp", "Giant Carp on a Stick", 150, "Giant Sun Carp", 1)
	// , buildRecipe("carp", "Trophy Carp on a Stick", 150, "Trophy Sun Carp", 2)
	// , buildRecipe("carp", "Fabled Carp on a Stick", 200, "Fabled Sun Carp", [3, 5])
];
