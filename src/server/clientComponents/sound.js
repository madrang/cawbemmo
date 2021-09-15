define([
	'js/sound/sound'
], function (
	soundManager
) {
	return {
		type: 'sound',

		sound: null,
		volume: 0,

		init: function () {
			const { 
				sound, volume, music, defaultMusic,
				obj: { zoneId, x, y, width, height, area }
			} = this;

			const config = {
				scope: zoneId,
				file: sound,
				volume, 
				x, 
				y, 
				w: width, 
				h: height, 
				area,
				music,
				defaultMusic,
				loop: true
			};

			soundManager.addSound(config);
		}
	};
});
