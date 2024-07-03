module.exports = {
	name: "Vlad Vs. Igor"
	, description: "Vlad et ses sbir attaque Igor."
	, code: "vladAttack"
	, distance: 10
	, cron: "34 */2 * * *"
	, disabled: false
	, endMark: 2000
	, failure: [ // Not Implemented...
		{ type: "killMob"
			, mobs: "Igor"
			, endMark: 1950
		}
	]
	, phases: [
		{ type: "spawnMob"
			, spawnRect: { x: 120, y: 94 }
			, mobs: [
				{ name: "Sbire facher"
					, amount: 4
					, attackable: true
					, level: 5
					, sheetName: "mobs"
					, cell: 35
					, id: "sbire-$"
					, hpMult: 5
					, dmgMult: 1
					, maxChaseDistance: 5
					, drops: {
						rolls: 0
					}
					, pos: [
						{ x: 0, y: 0 }
						, { x: 4, y: 0 }
						, { x: 0, y: 4 }
						, { x: 4, y: 4 }
					]
					, spells: [
						{ type: "melee" }
					]
				}
				, { name: "Gros Sbire"
					, level: 8
					, attackable: true
					, sheetName: "mobs"
					, cell: 35
					, id: "gros-sbire"
					, hpMult: 10
					, dmgMult: 2
					, maxChaseDistance: 5
					, pos: { x: 2, y: 2 }
					, spells: [
						{ type: "melee" }
					]
				}
				, { name: "Vlad"
					, exists: true
					, pos: { x: 3, y: 2 }
				}
				, { name: "Igor"
					, exists: true
					, pos: { x: 3, y: 3 }
				}
			]
		}
		, { type: "locateMob"
			, announce: "Vlad et les Sbires attaques Igors!"
			, mobs: "gros-sbire"
			, distance: 5
		}
		, { type: "eventChain"
			, config: [
				{ type: "mobTalk"
					, id: "sbire-1"
					, text: "Boss! Laisse moi le tuer!"
					, delay: 10
				}
				, { type: "mobTalk"
					, id: "sbire-2"
					, text: "Non! Je vais le tuer..."
					, delay: 10
				}
				, { type: "mobTalk"
					, id: "gros-sbire"
					, text: "Tout le monde en meme temps! Tuez le!"
					, delay: 10
				}
				, { type: "addComponents"
					, mobs: [
						"gros-sbire"
						, "sbire-0", "sbire-1", "sbire-2", "sbire-3"
					]
					, components: [{
						type: "aggro"
						, faction: "hostile"
					}]
				}
			]
		}
		, { type: "killMob"
			, mobs: [
				"gros-sbire"
				, "sbire-0"
				, "sbire-1"
				, "sbire-2"
				, "sbire-3"
			]
		}
		, { type: "eventChain"
			, config: [
				{ type: "mobTalk"
					, id: "Vlad"
					, text: "Des Sbires j'en ait pleins, tu va mourir!!"
					, delay: 10
				}
				, { type: "addComponents"
					, mobs: "Vlad"
					, components: [
						{ type: "aggro"
							, faction: "hostile"
						}
					]
				}
			]
		}
		, { type: "spawnMob"
			, spawnRect: { x: 120, y: 94 }
			, mobs: [
				{ name: "Sbire facher"
					, amount: 4
					, attackable: true
					, level: 5
					, sheetName: "mobs"
					, cell: 35
					, id: "sbire-$"
					, hpMult: 5
					, dmgMult: 1
					, maxChaseDistance: 5
					, drops: {
						rolls: 0
					}
					, pos: [
						{ x: 0, y: 0 }
						, { x: 4, y: 0 }
						, { x: 0, y: 4 }
						, { x: 4, y: 4 }
					]
					, spells: [
						{ type: "melee" }
					]
				}
				, { name: "Gros Sbire"
					, amount: 2
					, level: 8
					, attackable: true
					, sheetName: "mobs"
					, cell: 35
					, id: "gros-sbire-$"
					, hpMult: 10
					, dmgMult: 2
					, maxChaseDistance: 5
					, pos: { x: 2, y: 2 }
					, spells: [
						{ type: "melee" }
					]
				}
				, { name: "Vlad"
					, exists: true
					, pos: { x: 3, y: 2 }
				}
				, { name: "Igor"
					, exists: true
					, pos: { x: 3, y: 3 }
				}
			]
		}
		, { type: "killMob"
			, mobs: "Vlad"
			, percentage: 0.2
		}
		, { type: "eventChain"
			, config: [
				{ type: "removeComponents"
					, mobs: "Vlad"
					, components: "aggro"
				}
				, { type: "mobTalk"
					, id: "Vlad"
					, text: "Ha non! J'ai une truite sur le feux!"
					, delay: 10
				}
			]
		}
		, { type: "spawnMob"
			, mobs: {
				name: "Vlad"
				, exists: true
				, pos: { x: 122, y: 93 }
			}
		}
		, { type: "eventChain"
			, config: [
				{ type: "mobTalk"
					, id: "Vlad"
					, text: "Je doit partir avant que a brule!"
					, delay: 10
				}
			]
		}
		, { type: "spawnMob"
			, mobs: {
				name: "Vlad"
				, exists: true
				, pos: { x: 122, y: 92 }
			}
		}
	]
};
