define([
	'js/system/events',
	'js/system/globals'
], function (
	events,
	globals
) {
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

	return {
		templates: {},

		init: function () {
			let cpns = globals.clientConfig.clientComponents;
			return Promise.all(cpns.map(c => this.getComponent(c)));
		},

		getComponent: function (cpn) {
			return new Promise(resolve => {
				require([cpn.path], this.onGetComponent.bind(this, resolve, cpn));
			});
		},

		onGetComponent: function (resolve, cpn, template) {
			template.eventList = {};
			template.hookEvent = hookEvent;
			template.unhookEvents = unhookEvents;

			this.templates[cpn.type] = template;

			resolve();
		},
		
		getTemplate: function (type) {
			if (type === 'lightpatch')
				type = 'lightPatch';

			let template = this.templates[type] || {
				type: type
			};

			return template;
		}
	};
});
