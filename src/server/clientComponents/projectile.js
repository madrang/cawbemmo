define([
	'js/rendering/effects'
], function (
	effects
) {
	return {
		type: 'projectile',

		source: null,
		target: null,

		row: null,
		col: null,

		x: 0,
		y: 0,

		ttl: 50,
		endTime: 0,

		particles: null,

		init: function (blueprint) {
			if ((!this.source) || (!this.target)) {
				this.obj.destroyed = true;
				return;
			}

			this.endTime = Date.now() + this.ttl;

			let source = this.source;
			this.x = source.x;
			this.y = source.y;

			if (blueprint.projectileOffset) {
				if ((source.sprite) && (source.sprite.scale.x < 0))
					blueprint.projectileOffset.x *= -1;

				this.x += (blueprint.projectileOffset.x || 0);
				this.y += (blueprint.projectileOffset.y || 0);
			}

			this.obj.x = this.x;
			this.obj.y = this.y;

			let particlesBlueprint = this.particles ? {
				blueprint: this.particles
			} : {
				blueprint: {
					color: {
						start: ['7a3ad3', '3fa7dd'],
						end: ['3fa7dd', '7a3ad3']
					},
					scale: {
						start: {
							min: 2,
							max: 14
						},
						end: {
							min: 0,
							max: 8
						}
					},
					lifetime: {
						min: 1,
						max: 3
					},
					alpha: {
						start: 0.7,
						end: 0
					},
					randomScale: true,
					randomColor: true,
					chance: 0.6
				}
			};

			particlesBlueprint.new = this.new;

			this.particles = this.obj.addComponent('particles', particlesBlueprint);
			this.obj.addComponent('explosion', particlesBlueprint);

			effects.register(this);
		},

		renderManual: function () {
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
				if (!this.noExplosion)
					source.explosion.explode();
				source.destroyed = true;
			} else {
				this.x += (tx - this.x) / ticksLeft;
				this.y += (ty - this.y) / ticksLeft;

				source.x = (Math.floor((this.x * scale) / 4) * 4) / scale;
				source.y = (Math.floor((this.y * scale) / 4) * 4) / scale;
			}
		},

		destroy: function () {
			effects.unregister(this);
		}
	};
});
