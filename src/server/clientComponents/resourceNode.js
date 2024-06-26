define([
	"js/misc/physics"
], function (
	physics
) {
	const bptParticles = {
		chance: 0.1
		, blueprint: {
			spawnChance: 0.025
			, behaviors: [
				{ type: "color"
					, config: {
						color: {
							list: [
								{ time: 0, value: "f2f5f5" }
								, { time: 1, value: "f1f4f4" }
							]
						}
					}
				}
				, { type: "alpha"
					, config: {
						alpha: {
							list: [
								{ time: 0, value: 0.75 }
								, { time: 1, value: 0.2 }
							]
						}
					}
				}
				, { type: "scale"
					, config: {
						scale: {
							list: [
								{ time: 0, value: 6 }
								, { time: 1, value: 2 }
							]
						}
					}
				}
			]
		}
	};

	return {
		type: "resourceNode"

		, init: function () {
			const x = this.obj.x;
			const y = this.obj.y;
			const w = this.obj.width || 1;
			const h = this.obj.height || 1;
			for (let i = x; i < x + w; i++) {
				for (let j = y; j < y + h; j++) {
					const bpt = _.assignWith("particles", {}, bptParticles, {
						new: true
					});
					if (this.nodeType === "fish") {
						if (!physics.isTileBlocking(i, j)) {
							continue;
						}
						if (Math.random() < 0.4) {
							continue;
						}
						_.assignWith("particles", bpt.blueprint, {
							behaviors: [
								{ type: "color"
									, config: {
										color: {
											list: [
												{ time: 0, value: "48edff" }
												, { time: 1, value: "47ecfe" }
											]
										}
									}
								}
								, { type: "spawnShape"
									, config: {
										type: "rect"
										, data: { x: 40 * (i - x), y: 40 * (j - y), w: 40, h: 40 }
									}
								}
							]
						});
					}
					this.obj.addComponent("particles", bpt);
				}
			}
		}
	};
});
