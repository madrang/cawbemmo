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

	let cpns = [];

	return {
		templates: {},

		init: function () {
			cpns = globals.clientConfig.clientComponents;

			cpns = cpns.map(c => ({
				...c,
				promise: this.getComponent(c)
			}));

			return Promise.all(cpns.map(c => c.promise));
		},

		getComponent: function (cpn) {
			return new Promise(resolve => {
				require([cpn.path], this.onGetComponent.bind(this, resolve, cpn));
			});
		},

		onGetComponent: function (resolve, cpn, template) {
			if (cpn.type) {
				template.eventList = {};
				template.hookEvent = hookEvent;
				template.unhookEvents = unhookEvents;

				this.templates[cpn.type] = template;

				resolve();
			} else if (cpn.extends) {
				let target = cpn.extends;

				if (!this.templates[target]) {
					let waitFor = cpns.find(c => c.type === target);
					
					if (waitFor) {
						waitFor.promise.then(() => {
							this.templates[target] = $.extend(true, this.templates[target], template);
							resolve();
						});
					} else {
						// There's no file for that component type for us to extend
						resolve();
					}
				} else {
					this.templates[target] = $.extend(true, this.templates[target], template);
					resolve();
				}
			} else {
				// This shouldn't get reached
				resolve();
			}
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
