define([
	"js/rendering/effects"
	, "js/rendering/renderer"
], function (
	effects,
	renderer
) {
	const getEmitterConfig = function(pos, blueprint, maxAlpha) {
		return {
			lifetime: blueprint.lifetime || {
				min: 1
				, max: 4
			}
			, frequency: 0.9 + Math.random().toFixed(1)
			, emitterLifetime: -1
			, addAtBack: false
			, pos
			, behaviors: [
				{ type: "textureRandom"
					, config: {
						textures: [ "images/particles.png" ]
					}
				}
				, { type: "color"
					, config: {
						color: {
							list: blueprint.color || [
								{ time: 0, value: [ "ffeb38" ] }
								, { time: 1, value: [ "ffeb38", "ff6942", "d43346" ] }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: maxAlpha }
								, { time: 1, value: 0 }
							]
						}
					}
				}
				, { type: "blendMode"
					, config: { blendMode: "screen" }
				}

				, { type: "moveSpeed",
					config: {
						speed: {
							list: [
								{ time: 0, value: 4 }
								, { time: 1, value: 2 }
							]
						}
					}
				}
				, { type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: { min: 24, max: 32 } }
								, { time: 1, value: { min: 12, max: 22 } }
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
		}
	}
	return {
		type: "light"

		, lightCd: 0
		, lightO: {}

		, emitters: {}

		, range: 3

		, init: function (blueprint) {
			this.blueprint = $.extend(true, this.blueprint || {}, blueprint);
			const range = this.range;
			const halfRange = (range - 1) / 2;
			for (let i = 0; i < range; i++) {
				for (let j = 0; j < range; j++) {
					const maxAlpha = (1 + ((halfRange * 2) - (Math.abs(halfRange - i) + Math.abs(halfRange - j)))) * 0.1;
					const emConf = getEmitterConfig({
						x: ((this.obj.x + i - halfRange) * scale) + (scale / 2)
						, y: ((this.obj.y + j - halfRange) * scale) + (scale / 2)
					}, this.blueprint, maxAlpha);
					emConf.obj = this.obj;
					this.emitters[`${i}|${j}`] = renderer.buildEmitter(emConf);
				}
			}
			this.setVisible(this.obj.isVisible);
		}

		, update: function () {

		}

		, setVisible: function (visible) {
			let emitters = this.emitters;
			for (let p in emitters) {
				emitters[p].emit = visible;
			}
		}

		, destroy: function () {
			let keys = Object.keys(this.emitters);
			for (let i = 0; i < keys.length; i++) {
				let emitter = this.emitters[keys[i]];
				delete this.emitters[keys[i]];

				renderer.destroyEmitter(emitter);
			}
		}
	};
});
