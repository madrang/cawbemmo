define([
	"js/rendering/effects"
], function (
	effects
) {
	return {
		type: "explosion"

		, blueprint: null

		, init: function (blueprint) {
			this.blueprint = {
				new: true
				, blueprint: _.assignWith("particles", {
					particlesPerWave: 14
					, behaviors: [
						{ type: "color"
							, config: {
								color: {
									list: [
										{ time: 0, value: ["fcfcfc", "929398"] }
										, { time: 1, value: ["505360", "3c3f4c"] }
									]
								}
							}
						}
						, { type: "scale"
							, config: {
								scale: {
									list: [
										{ time: 0, value: { min: 8, max: 18 } }
										, { time: 1, value: { min: 4, max: 12 } }
									]
								}
							}
						}
					]
				}, blueprint.blueprint, {
					spawnChance: 1
					, behaviors: [
						{ type: "moveSpeed",
							config: {
								speed: {
									list: [
										{ time: 0, value: { min: 4, max: 24 } }
										, { time: 1, value: { min: 2 , max: 18 } }
									]
								}
							}
						}
						, { type: "scale"
							, config: {
								scale: {
									list: [
										{ time: 0, value: { min: 6, max: 16 } }
										, { time: 1, value: { min: 0, max: 10 } }
									]
								}
							}
						}
						, { type: "spawnBurst"
							, config: { start: 0, spacing: 0, distance: 0 }
						}
					]
				})
			};
		}

		, explode: function (blueprint) {
			if (!this.obj.isVisible) {
				return;
			}
			const particles = this.obj.addComponent("particles", this.blueprint);
			particles.emitter.update(0.2);
			particles.emitter.emit = false;
			particles.emitter.disabled = true;
		}
	};
});
