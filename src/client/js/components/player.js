define([
	'js/rendering/renderer',
	'js/system/events',
	'js/misc/physics',
	'js/sound/sound'
], function (
	renderer,
	events,
	physics,
	sound
) {
	return {
		type: 'player',

		oldPos: {
			x: 0,
			y: 0
		},

		init: function () {
			const obj = this.obj;

			obj.addComponent('keyboardMover');
			obj.addComponent('mouseMover');

			if (isMobile)
				obj.addComponent('touchMover');

			obj.addComponent('serverActions');
			obj.addComponent('pather');

			this.hookEvent('onRespawn', this.onRespawn.bind(this));

			events.emit('onGetPortrait', obj.portrait);
		},

		extend: function (blueprint) {
			let collisionChanges = blueprint.collisionChanges;
			delete blueprint.collisionChanges;

			if (collisionChanges)
				collisionChanges.forEach(c => physics.setCollision(c));
		},

		update: function () {
			const obj = this.obj;
			const x = obj.x;
			const y = obj.y;

			let oldPos = this.oldPos;

			if ((oldPos.x === x) && (oldPos.y === y))
				return;

			oldPos.x = x;
			oldPos.y = y;

			sound.update(x, y);

			this.positionCamera(x, y);
		},

		positionCamera: function (x, y, instant) {
			renderer.setPosition({
				x: (x - (renderer.width / (scale * 2))) * scale,
				y: (y - (renderer.height / (scale * 2))) * scale
			}, instant);
		},

		onRespawn: function ({ x, y }) {
			this.positionCamera(x, y, true);
			sound.update(x, y);
		},

		destroy: function () {
			this.unhookEvents();
		}
	};
});
