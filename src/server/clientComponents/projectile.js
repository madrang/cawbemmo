define([
	"js/rendering/effects"
], function (
	effects
) {
	return {
		type: "projectile"

		, source: null
		, target: null

		, row: null
		, col: null

		, x: 0
		, y: 0

		, ttl: 50
		, endTime: 0

		, particles: null

		, init: function (blueprint) {
			if ((!this.source) || (!this.target)) {
				this.obj.destroyed = true;
				return;
			}

			this.endTime = Date.now() + this.ttl;

			let source = this.source;
			this.x = source.x;
			this.y = source.y;

			if (blueprint.projectileOffset) {
				if ((source.sprite) && (source.sprite.scale.x < 0)) {
					blueprint.projectileOffset.x *= -1;
				}

				this.x += (blueprint.projectileOffset.x || 0);
				this.y += (blueprint.projectileOffset.y || 0);
			}

			this.obj.x = this.x;
			this.obj.y = this.y;

			const particlesBlueprint = (this.particles ? {
				blueprint: this.particles
			} : {
				blueprint: {
					lifetime: { min: 1, max: 3 }
					, behaviors: [
						{ type: "color"
							, config: {
								color: {
									list: [
										{ time: 0, value: [ "7a3ad3", "3fa7dd" ] }
										, { time: 1, value: [ "3fa7dd", "7a3ad3" ] }
									]
								}
							}
						}
						, { type: "alpha"
							, config: {
								alpha: {
									list: [
										{ time: 0, value: 0.7 }
										, { time: 1, value: 0.1 }
									]
								}
							}
						}
						, { type: "scale"
							, config: {
								scale: {
									list: [
										{ time: 0, value: { min: 2, max: 14 } }
										, { time: 1, value: { min: 1, max: 8 } }
									]
								}
							}
						}
					]
					, spawnChance: 0.6
				}
			});
			particlesBlueprint.new = this.new;

			this.particles = this.obj.addComponent("particles", particlesBlueprint);
			this.obj.addComponent("explosion", particlesBlueprint);

			effects.register(this);
		}

		, renderManual: function () {
			const source = this.obj;
			const target = this.target;

			//Cater for offset (which isn't tile based yet)
			const tx = target.x + ((target.offsetX || 0) / scale);
			const ty = target.y + ((target.offsetY || 0) / scale);

			const ticksLeft = Math.floor((this.endTime - Date.now()) / 16);
			if (ticksLeft <= 0) {
				source.x = tx;
				source.y = ty;
				this.particles.emitter.emit = false;
				if (!this.noExplosion) {
					source.explosion.explode();
				}
				source.destroyed = true;
			} else {
				this.x += (tx - this.x) / ticksLeft;
				this.y += (ty - this.y) / ticksLeft;

				source.x = (Math.floor((this.x * scale) / 4) * 4) / scale;
				source.y = (Math.floor((this.y * scale) / 4) * 4) / scale;
			}
		}

		, destroy: function () {
			effects.unregister(this);
		}
	};
});
