define([
	'js/system/client',
	'js/system/events',
	'js/misc/physics'
], function (
	client,
	events,
	physics
) {
	return {
		type: 'gatherer',
		effect: null,

		init: function () {
			this.obj.on('onKeyDown', this.onKeyDown.bind(this));
			this.hookEvent('onRezone', this.onRezone.bind(this));
		},

		extend: function (msg) {
			if ((msg.width) && (msg.progress !== 100)) {
				if (this.effect)
					this.effect.destroyed = true;

				let x = 0;
				let y = 0;
				do {
					x = msg.x + ~~(Math.random() * msg.width);
					y = msg.y + ~~(Math.random() * msg.height);
				} while (!physics.isTileBlocking(x, y) || Math.max(Math.abs(x - this.obj.x), Math.abs(y - this.obj.y)) <= 2);

				this.obj.flipX = (x < this.obj.x);
				this.obj.setSpritePosition();

				this.effect = this.obj.addComponent('lightningEffect', {
					new: true,
					toX: x,
					toY: y,
					ttl: -1,
					divisions: 4,
					cdMax: 12,
					colors: [0xc0c3cf, 0xc0c3cf, 0x929398],
					maxDeviate: 5,
					lineGrow: true,
					lineShrink: true
				});
			} else {
				if ((msg.progress === 100) && (this.effect)) {
					this.effect.destroyed = true;
					this.effect = null;
				}

				events.emit('onShowProgress', (msg.action || 'Gathering') + '...', msg.progress);
			}
		},

		onRezone: function () {
			this.extend({
				progress: 100,
				action: 'Fishing'
			});
		},

		onKeyDown: function (key) {
			if (key !== 'g')
				return;

			client.request({
				cpn: 'player',
				method: 'performAction',
				data: {
					cpn: 'gatherer',
					method: 'gather'
				}
			});
		},

		destroy: function () {
			this.unhookEvents();
		}
	};
});
