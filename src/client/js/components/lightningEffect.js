define([
	'js/rendering/lightningBuilder',
	'js/rendering/effects'
], function(
	lightningBuilder,
	effects
) {
	return {
		type: 'lightningEffect',

		cd: 0,
		cdMax: 1,

		effect: null,

		ttl: 6000,

		init: function() {
			effects.register(this);

			var xOffset = (this.toX > this.obj.x) ? 1 : 0;

			this.effect = lightningBuilder.build({
				fromX: this.obj.x + xOffset,
				fromY: this.obj.y + 0.5,
				toX: this.toX + 0.5,
				toY: this.toY + 0.5
			});
		},

		renderManual: function() {
			if (this.cd > 0) {
				this.cd--;
				return;
			}

			this.cd = this.cdMax;

			lightningBuilder.destroy(this.effect);

			this.ttl--;
			if (this.ttl == 0) {
				this.destroyed = true;
				return;
			}

			var xOffset = (this.toX > this.obj.x) ? 1 : 0;

			this.effect = lightningBuilder.build({
				fromX: this.obj.x + xOffset,
				fromY: this.obj.y + 0.5,
				toX: this.toX + 0.5,
				toY: this.toY + 0.5
			});
		},

		destroyManual: function() {
			//lightningBuilder.destroy(this.effect);

			effects.unregister(this);
		}
	};
});