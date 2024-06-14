define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'moveAnimation',

		targetX: 0,
		targetY: 0,

		x: 0,
		y: 0,

		ttl: 50,
		endTime: 0,

		particles: null,
		particleBlueprint: null,

		particleExplosionBlueprint: null,

		init: function (blueprint) {
			const particleBlueprint = $.extend({
				scale: {
					start: {
						min: 6,
						max: 16
					},
					end: {
						min: 0,
						max: 10
					}
				},
				opacity: {
					start: 0.05,
					end: 0
				},
				lifetime: {
					min: 1,
					max: 2
				},
				speed: {
					start: {
						min: 2,
						max: 20
					},
					end: {
						min: 0,
						max: 8
					}
				},
				color: {
					start: 'fcfcfc',
					end: 'c0c3cf'
				},
				randomScale: true,
				randomSpeed: true,
				chance: 0.4
			}, this.particleBlueprint);

			this.particles = this.obj.addComponent('particles', { blueprint: particleBlueprint });

			this.endTime = Date.now() + this.ttl;

			let obj = this.obj;
			this.x = obj.x;
			this.y = obj.y;

			if (this.targetX > this.x) 
				this.obj.flipX = false;
			
			else if (this.targetX < this.x)
				this.obj.flipX = true;

			this.obj.setSpritePosition();
		},

		update: function () {
			const source = this.obj;
			const target = this.target;
			const ticksLeft = Math.floor((this.endTime - Date.now()) / 16);
			if (ticksLeft <= 0) {
				source.x = this.targetX;
				source.y = this.targetY;
				source.setSpritePosition();

				this.destroyed = true;
				this.particles.destroyed = true;

				//Sometimes we just move to a point without exploding
				if (target) {
					target.addComponent('explosion', {
						new: true,
						blueprint: this.particleExplosionBlueprint || {}
					}).explode();
				}
			} else {
				this.x += (this.targetX - this.x) / ticksLeft;
				this.y += (this.targetY - this.y) / ticksLeft;

				source.x = (Math.floor((this.x * 32) / 8) * 8) / 32;
				source.y = (Math.floor((this.y * 32) / 8) * 8) / 32;
				source.setSpritePosition();
			}

			renderer.updateSprites();
		}
	};
});
