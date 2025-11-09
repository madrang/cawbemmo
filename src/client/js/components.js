define([
	"js/system/events"
	, "js/system/globals"
], function (
	events,
	globals
) {
	//Store templates here after loading them
	const templates = [];
	const extenders = [];

	//Bound Methods
	const hookEvent = function (e, cb) {
		if (!this.eventList[e]) {
			this.eventList[e] = [];
		}
		this.eventList[e].push(cb);
		events.on(e, cb);
	};

	const unhookEvents = function () {
		for (const eventName in this.eventList) {
			const callbacks = this.eventList[eventName];
			for (const c of callbacks) {
				events.off(eventName, c);
			}
		}
	};

	//Helpers
	const loadComponent = (cpn) => {
		return new Promise((res) => {
			require([cpn.path], (tpl) => {
				if (cpn.type) {
					templates.push(tpl);
				}
				if (cpn.extends) {
					extenders.push({ extends: cpn.extends, tpl });
				}
				res();
			});
		});
	};

	//Init Methods
	const loadComponents = (paths) => {
		return Promise.all(
			paths.map((p) => loadComponent(p))
		);
	};

	const buildComponents = () => {
		for (const t of templates) {
			const extensions = extenders.filter((e) => e.extends === t.type);
			for (const e of extensions) {
				_.assign(t, e.tpl);
			}
			t.eventList = {};
			t.hookEvent = hookEvent;
			t.unhookEvents = unhookEvents;
		}
	};

	//Export
	return {
		init: async function () {
			const paths = globals.clientConfig.clientComponents;
			await loadComponents(paths);
			buildComponents();
		}

		, getTemplate: function (type) {
			if (type === "lightpatch") {
				type = "lightPatch";
			}
			return templates.find((t) => t.type === type) || { type: type };
		}
	};
});
