import events from "/js/system/events.js";
import factory from "/ui/factory.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/loader/template.html", { raw: true });

const loadingProgress = {
	resources: 0
	, components: 0
	, sounds: 0
};

const setLoaderProgress = ({ type, progress }) => {
	loadingProgress[type] = progress;

	// Calculate total progress (average of all types)
	let modsCount = 0;
	let loadingTotal = 0;
	for (const pctAmount of Object.values(loadingProgress)) {
		modsCount++;
		loadingTotal += pctAmount;
	}
	const totalProgress = loadingTotal / modsCount;
	_.log.loader.info(`Loading ${(totalProgress * 100).toFixed(2)}% - ${type} ${(progress * 100).toFixed(2)}%`);

	const uiLoader = factory.getUi("loader");
	if (uiLoader) {
		uiLoader.setLoaderProgress(totalProgress);
	}
};

export default {
	tpl: template
	, init: function () {
		events.on("loaderProgress", setLoaderProgress);
	}
	, beforeDestroy: function () {
		events.off("loaderProgress", setLoaderProgress);
	}
	, setLoaderProgress: async function (pctProgress) {
		// Handle fade out animation when loading is complete
		if (pctProgress >= 1 && this.el) {
			this.el.classList.add("fade-out"); // Add fade-out class to trigger animation
			await _.asyncDelay(500);
			this.el.hide();
		}
	}
};
