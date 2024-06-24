define([

], function (

) {
	return {
		lifetime: {
			min: 1
			, max: 3
		}
		, frequency: 1
		, emitterLifetime: -1
		, addAtBack: false
		, pos: { x: 0, y: 0 }
		, behaviors: [
			{ type: "textureRandom"
				, config: {
					textures: [ "images/particles.png" ]
				}
			}
			, { type: "color"
				, config: {
					color: {
						list: [
							{ time: 0, value: [ "fcfcfc", "80f643" ] }
							, { time: 1, value: [ "c0c3cf", "2b4b3e" ] }
						]
					}
				}
			}
			, { type: "alpha"
				, config: {
					alpha: {
						list: [
							{ time: 0, value: 0.5 }
							, { time: 1, value: 0 }
						]
					}
				}
			}
			, { type: "blendMode"
				, config: { blendMode: "add" }
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
			, { type: "scale"
				, config: {
					scale: {
						list: [
							{ time: 0, value: { min: 16, max: 30 } }
							, { time: 1, value: { min: 8, max: 14 } }
						]
					}
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
						, radius: 0.1
						, innerRadius: 0
						, affectRotation: false
					}
				}
			}
		]
	};
});
