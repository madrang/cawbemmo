define([

], function (

) {
	return {

		addAtBack: false

		// https://pixijs.io/particle-emitter/docs/modules/behaviors.html
		, behaviors: [
			{ type: "textureSingle"
				, config: { texture: "images/particle.png" }
			}
			/*
			{ type: "textureRandom"
				, config: {
					textures: [ "images/particles.png" ]
				}
			}
			*/
			, { type: "color"
				, config: {
					color: {
						list: [
							{ time: 0, value: "fb1010" }
							, { time: 1, value: "f5b830" }
						]
					}
				}
			}
			, { type: "alpha"
				, config: {
					alpha: {
						list: [
							{ time: 0, value: 0.9 }
							, { time: 1, value: 0.2 }
						]
					}
				}
			}
			, { type: "blendMode"
				, config: { blendMode: "add" }
			}

			, { type: "scale"
				, config: {
					scale: {
						list: [
							{ time: 0, value: 10 }
							, { time: 1, value: 0.3 }
						]
					}
					// A value between minimum scale multipler and 1 is randomly generated
					// and multiplied with each scale value to provide the actual scale for each particle.
					, minMult: 1
				}
			}
			, { type: "moveSpeed",
				config: {
					speed: {
						list: [
							{ time: 0, value: 12 }
							, { time: 1, value: 2 }
						]
					}
					// A value between minimum scale multipler and 1 is randomly generated
					// and multiplied with each scale value to provide the actual scale for each particle.
					, minMult: 1
				}
			}
			, { type: "rotationStatic",
				config: { min: 0, max: 360 }
			}

			, { type: "spawnShape"
				, config: {
					type: "torus"
					, data: {
						x: 0, y: 0
						, radius: 10
						, innerRadius: 0
						, affectRotation: false
					}
				}
			}
		]

		, emitterLifetime: -1

		// 0.035 for 35ms - For a tick rate of 350ms, this will do 10 times per tick.
		, frequency: 0.035

		, lifetime: { min: 1, max: 3 }

		, pos: { x: 0, y: 0 }

		, spawnChance: 1
	};
});
