module.exports = {
	name: "Le Snack BAR"
	, level: [2, 3]
	, resources: {
		champignon: {
			type: "herb"
			, max: 4
		}
		, weed: {
			type: "herb"
			, max: 10
			//, cdMax: 17100
		}
	}
	, objects: {}
	, mobs: {
		default: {
			level: 2
			, faction: "hostile"
			, regular: {
				drops: {
					chance: 40
					, rolls: 1
				}
			}
		}
		mouette: {
			level: 2
			, regular: {
				drops: {
					chance: 55
					, rolls: 1
				}
			}
			, rare: {
				name: "Ronald"
			}
			, questItem: {
				name: "Poulet louche"
				, sprite: [0, 0]
			}
		}
		, "Sbire": {
			level: 3
			, faction: "hostile"
			, regular: {
				drops: {
					chance: 55
					, rolls: 1
				}
			}
			, questItem: {
				name: "Cagoule"
				, sprite: [0, 0]
			}
		}

	}
};
