module.exports = {
	name: "Cabanne"
	, level: [1, 20]
	, resources: {
		weed: {
			type: "herb"
			, max: 15
			, cdMax: 17100
		}
	}
	, objects: {}
	, mobs: {
		default: {
			regular: {
				drops: {
					chance: 40
					, rolls: 1
				}
			}
		}

		, poulet: {
			attackable: false
			, level: 3
			, rare: {
				count: 0
			}
		}
		, cochon: {
			attackable: false
			, level: 3
			, rare: {
				count: 0
			}
		}
		, goat: {
			attackable: false
			, level: 3
			, rare: {
				count: 0
			}
		}
		, vache: {
			attackable: true
			, level: 3
			, regular: {
				drops: {
					rolls: 1
					, noRandom: true
					, alsoRandom: false
					, blueprints: [{
						chance: 75
						, name: "Steak"
						, material: true
						, sprite: [1, 4]
						, spritesheet: "images/materials.png"
					}]
				}
			}
			, rare: {
				count: 0
			}
		}

	}
};
