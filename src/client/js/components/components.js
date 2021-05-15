let components = [
	'keyboardMover',
	'mouseMover',
	'touchMover',
	'player',
	'pather',
	'attackAnimation',
	'lightningEffect',
	'moveAnimation',
	'bumpAnimation',
	'animation',
	'light',
	'lightPatch',
	'projectile',
	'particles',
	'explosion',
	'spellbook',
	'inventory',
	'stats',
	'chest',
	'effects',
	'quests',
	'events',
	'resourceNode',
	'gatherer',
	'stash',
	'flash',
	'chatter',
	'dialogue',
	'trade',
	'reputation',
	'serverActions',
	'social',
	'passives',
	'sound',
	'whirlwind',
	'fadeInOut'
].map(function (c) {
	return 'js/components/' + c;
});

define([
	...components, 
	'../system/events'
], function () {
	const events = arguments[arguments.length - 1];
	
	const hookEvent = function (e, cb) {
		if (!this.eventList[e])
			this.eventList[e] = [];

		this.eventList[e].push(cb);
		events.on(e, cb);
	};

	const unhookEvents = function () {
		Object.entries(this.eventList).forEach(([eventName, callbacks]) => {
			callbacks.forEach(c => events.off(eventName, c));
		});
	};

	let templates = {};

	[].forEach.call(arguments, function (t, i) {
		//Don't do this for the events module
		if (i === arguments[2].length - 1)
			return;

		t.eventList = {};
		t.hookEvent = hookEvent;
		t.unhookEvents = unhookEvents;

		templates[t.type] = t;
	});

	return {
		getTemplate: function (type) {
			if (type === 'lightpatch')
				type = 'lightPatch';

			let template = templates[type] || {
				type: type
			};

			return template;
		}
	};
});
