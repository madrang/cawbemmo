const events = require("../misc/events");

const spells = [
	{ name: "Melee"
		, description: "Performs a quick melee attack."
		, type: "melee"
		, icon: [7, 0]
	}

	, { name: "Projectile"
		, description: "Performs a basic magical attack."
		, type: "projectile"
		, icon: [7, 1]
		, animation: "hitStaff"
		, row: 11
		, col: 4
		, speed: 110
		, particles: {
			lifetime: { min: 1, max: 1 }
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 14 }
								, { time: 1, value: 8 }
							]
						}
						, minMult: 0.1
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "ff6942" }
								, { time: 0.33, value: "ffeb38" }
								, { time: 0.5, value: "ff6942" }
								, { time: 0.66, value: "d43346" }
								, { time: 1, value: "ff6942" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.6 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
			]
			, spawnChance: 0.25
		}
	}

	, { name: "Magic Missile"
		, description: "Launches an orb of unfocused energy at your target."
		, type: "projectile"
		, icon: [1, 0]
		, animation: "hitStaff"
		, particles: {
			lifetime: { min: 1, max: 3 }
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 14 }
								, { time: 1, value: 8 }
							]
						}
						, minMult: 0.1
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "3fa7dd" }
								, { time: 0.33, value: "7a3ad3" }
								, { time: 0.5, value: "3fa7dd" }
								, { time: 0.66, value: "7a3ad3" }
								, { time: 1, value: "3fa7dd" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.8 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
			]
			, spawnChance: 0.6
		}
	}

	, { name: "Ice Spear"
		, description: "A jagged projectile of pure ice pierces your target and slows his movement."
		, type: "iceSpear"
		, icon: [1, 1]
		, animation: "hitStaff"
		, particles: {
			lifetime: { min: 1, max: 2 }
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 12 }
								, { time: 1, value: 6 }
							]
						}
						, minMult: 0.1
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "48edff" }
								, { time: 0.33, value: "51fc9a" }
								, { time: 0.5, value: "48edff" }
								, { time: 0.66, value: "44cb95" }
								, { time: 1, value: "48edff" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.9 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
			]
			, frequency: 0.2
		}
	}

	, { name: "Fireblast"
		, description: "Unleashes a blast of fire that damages and pushes back nearby foes."
		, type: "fireblast"
		, icon: [1, 2]
		, animation: "raiseStaff"
		, particles: {
			emitterLifetime: 0.15
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 24 }
								, { time: 1, value: 12 }
							]
						}
						, minMult: 0.1
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "d43346" }
								, { time: 0.33, value: "faac45" }
								, { time: 0.5, value: "d43346" }
								, { time: 0.66, value: "929398" }
								, { time: 1, value: "c0c3cf" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.9 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 24 }
								, { time: 1, value: 12 }
							]
						}
						, minMult: 0.2
					}
				}
			]
			, frequency: 0.02
			, lifetime: { min: 1, max: 2 }
		}
	}

	, { name: "Smite"
		, description: "Calls down holy energy from the heavens upon your foe."
		, type: "smite"
		, row: 2
		, col: 0
		, icon: [0, 0]
		, animation: "hitStaff"
	}

	, { name: "Consecrate"
		, description: "Creates a circle of pure holy energy that heals allies for a brief period."
		, type: "healingCircle"
		, icon: [0, 1]
		, animation: "raiseStaff"
		, particles: {
			lifetime: { min: 1, max: 3 }
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 16 }
								, { time: 1, value: 4 }
							]
						}
						, minMult: 0.33
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "fcfcfc" }
								, { time: 0.33, value: "ffeb38" }
								, { time: 0.5, value: "fcfcfc" }
								, { time: 0.66, value: "faac45" }
								, { time: 1, value: "fcfcfc" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.55 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 12 }
								, { time: 1, value: 4 }
							]
						}
						, minMult: 0.2
					}
				}
			]
			, spawnChance: 0.02
		}
	}

	, { name: "Healing Touch"
		, description: "Restore health to a friendly target."
		, type: "singleTargetHeal"
		, spellType: "heal"
		, icon: [0, 3]
		, animation: "raiseStaff"
		, particles: {
			lifetime: { min: 1, max: 3 }
			, behaviors: [
				{ type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 16 }
								, { time: 1, value: 4 }
							]
						}
						, minMult: 0.33
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "fcfcfc" }
								, { time: 0.33, value: "ffeb38" }
								, { time: 0.5, value: "fcfcfc" }
								, { time: 0.66, value: "faac45" }
								, { time: 1, value: "fcfcfc" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.55 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 12 }
								, { time: 1, value: 4 }
							]
						}
						, minMult: 0.2
					}
				}
			]
			, spawnChance: 0.02
		}
	}

	, { name: "Holy Vengeance"
		, description: "Grants holy vengeance to a friendly target. For the duration of the effect, dealing damage will also heal the attacker."
		, type: "holyVengeance"
		, spellType: "buff"
		, icon: [0, 2]
	}

	, { name: "Slash"
		, description: "Performs a melee attack with your equipped weapon."
		, type: "slash"
		, row: 0
		, col: 0
		, icon: [3, 0]
		, animation: "hitSword"
	}

	, { name: "Charge"
		, type: "charge"
		, description: "Charges at a foe, dealing damage and stunning them for a short period."
		, icon: [3, 1]
		, animation: "raiseShield"
	}

	, { name: "Reflect Damage"
		, type: "reflectdamage"
		, description: "Gain an ethereal shield that reflects damage until the buff wears off."
		, icon: [3, 2]
		, animation: "raiseShield"
	}

	, { name: "Flurry"
		, type: "flurry"
		, description: "Grants a stack of frenzy, greatly inreasing your attack speed."
		, animation: "hitSword"
		, row: 1
		, col: 0
		, icon: [2, 3]
	}

	, { name: "Smokebomb"
		, type: "smokeBomb"
		, description: "Envelops the caster in a cloud of poisonous smoke, dealing damage to enemies every tick until it dissipates."
		, animation: "raiseHands"
		, icon: [2, 1]
		, particles: {
			lifetime: { min: 1, max: 3 }
			, behaviors: [
				{ type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "80f643" }
								, { time: 0.33, value: "fcfcfc" }
								, { time: 0.5, value: "80f643" }
								, { time: 0.66, value: "c0c3cf" }
								, { time: 1, value: "2b4b3e" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.3 }
								, { time: 1, value: 0.1 }
							]
						}
					}
				}
				, { type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 30 }
								, { time: 1, value: 14 }
							]
						}
						, minMult: 0.5
					}
				}
				, { type: "blendMode"
					, config: { blendMode: "screen" }
				}

				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 12 }
								, { time: 1, value: 2 }
							]
						}
					}
				}
			]
			, spawnChance: 0.03
		}
	}

	, { name: "Whirlwind"
		, description: "You furiously spin in a circle, striking all foes around you."
		, type: "whirlwind"
		, icon: [5, 0]
		, row: 5
		, col: 0
		, frames: 3
	}

	, { name: "Ambush"
		, type: "ambush"
		, description: "Step into the shadows and reappear behind your target before delivering a concussing blow."
		, icon: [2, 4]
		, animation: "raiseShield"
	}

	, { name: "Stealth"
		, description: "The thief slips into the shadows and becomes undetectable by foes. Performing an attack removes this effect."
		, type: "stealth"
		, icon: [2, 2]
	}

	, { name: "Crystal Spikes"
		, description: "Jagged crystals break through the ground at your target destination"
		, type: "warnBlast"
		, animation: "raiseHands"
		, icon: [0, 7]
		, particles: {
			lifetime: { min: 1, max: 1 }
			, behaviors: [
				{ type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "c0c3cf" }
								, { time: 0.33, value: "929398" }
								, { time: 0.5, value: "c0c3cf" }
								, { time: 0.66, value: "929398" }
								, { time: 1, value: "c0c3cf" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.2 }
								, { time: 1, value: 0 }
							]
						}
					}
				}
				, { type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 10 }
								, { time: 1, value: 4 }
							]
						}
						, minMult: 0.33
					}
				}
				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 16 }
								, { time: 1, value: 8 }
							]
						}
						, minMult: 0.1
					}
				}
			]
			, spawnChance: 0.075
		}
	}

	, { name: "Chain Lightning"
		, description: "Creates a circle of pure holy energy that heals allies for a brief period."
		, type: "chainLightning"
		, icon: [0, 1]
		, animation: "raiseStaff"
	}

	, { name: "Innervation"
		, description: "Grants an aura that regenerates hp for you and your allies."
		, type: "aura"
		, spellType: "aura"
		, icon: [3, 3]
	}

	, { name: "Tranquility"
		, description: "Grants an aura that regenerates mana for you and your allies."
		, type: "aura"
		, spellType: "aura"
		, icon: [3, 4]
	}

	, { name: "Swiftness"
		, description: "Grants an aura that grants increased movement speed to you and your allies."
		, type: "aura"
		, spellType: "aura"
		, icon: [3, 5]
	}
];

module.exports = {
	spells
	, init: function () {
		events.emit("onBeforeGetSpellsInfo", spells);
	}
};
