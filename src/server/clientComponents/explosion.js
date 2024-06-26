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
										{ time: 0, value: "929398" }
										, { time: 0.33, value: "fcfcfc" }
										, { time: 0.5, value: "929398" }
										, { time: 0.66, value: "3c3f4c" }
										, { time: 1, value: "505360" }
									]
								}
							}
						}
						, { type: "scale"
							, config: {
								scale: {
									list: [
										{ time: 0, value: 18 }
										, { time: 1, value: 12 }
									]
								}
								, minMult: 0.3
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
										{ time: 0, value: 24 }
										, { time: 1, value: 18 }
									]
								}
								, minMult: 0.11
							}
						}
						, { type: "scale"
							, config: {
								scale: {
									list: [
										{ time: 0, value: 16 }
										, { time: 1, value: 10 }
									]
								}
								, minMult: 0.1
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
