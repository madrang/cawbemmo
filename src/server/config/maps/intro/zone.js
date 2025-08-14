module.exports = {
	name: "Le Néant"
	, level: [1, 2]
	, resources: {
		"Ticket d'autobus": {
			type: "herb"
			, max: 4
		}
		
	}
	, objects: {
		talkBanddo: {
			properties: {
				cpnNotice: {
					actions: {
						enter: {
							cpn: "dialogue"
							, method: "talk"
							, args: [{
								targetName: "Banddo"
							}]
						}
						, exit: {
							cpn: "dialogue"
							, method: "stopTalk"
						}
					}
				}
			}
		}
	}
	, mobs: {
		default: {
			regular: {
				drops: {
					chance: 40
					, rolls: 1
				}
			}
		},
		"Banddo": {
			level: 10
			, walkDistance: 0
			, attackable: false
			, rare: {
				count: 0
			}
			, properties: {

			}
		}
		

	}
};
