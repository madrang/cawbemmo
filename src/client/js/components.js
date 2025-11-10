import events from "/js/system/events.js";
import globals from "/js/system/globals.js";

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
const loadComponent = async (cpnInfo) => {
	if (cpnInfo.type === "module") {
		const importedComponent = await import(cpnInfo.path);
		const cpn = importedComponent.default;
		if (cpn.type) {
			templates.push(cpn);
		}
		if (cpn.extends) {
			extenders.push({ extends: cpn.extends, cpn });
		}
	} else {
		_.log.components.error("Component type %s is unknown!", cpnInfo.type);
	}
};

//Init Methods
const loadComponents = (componentsInfos) => {
	let loadedCount = 0;
	return Promise.all(
		componentsInfos.map((cpnInfo) => loadComponent(cpnInfo)
			.then(() => {
				loadedCount++;
				events.emit("loaderProgress", {
					type: "components"
					, progress: loadedCount / componentsInfos.length
				});
			})
		)
	);
};

const buildComponents = () => {
	for (const t of templates) {
		const extensions = extenders.filter((e) => e.extends === t.type);
		for (const e of extensions) {
			_.assign(t, e.cpn);
		}
		t.eventList = {};
		t.hookEvent = hookEvent;
		t.unhookEvents = unhookEvents;
	}
};

export default {
	init: async function () {
		const componentsInfos = globals.clientConfig.clientComponents;
		await loadComponents(componentsInfos);
		buildComponents();
	}

	, getTemplate: function (type) {
		if (type === "lightpatch") {
			type = "lightPatch";
		}
		return templates.find((t) => t.type === type) || { type };
	}
};
