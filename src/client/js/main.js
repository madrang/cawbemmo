import "/js/misc/helpers.js";
import client from "/js/system/client.js";
import uiFactory from "/ui/factory.js";
import renderer from "/js/rendering/renderer.js";
import objects from "/js/objects/objects.js";
//import effects from "/js/rendering/effects.js";
import numbers from "/js/rendering/numbers.js";
import input from "/js/input.js";
import events from "/js/system/events.js";
import sound from "/js/sound/sound.js";
import globals from "/js/system/globals.js";
import locale from "/js/locale/index.js";
import resources from "/js/resources.js";
import components from "/js/components.js";
import "/ui/templates/tooltips/tooltips.js";

let fnQueueTick = null;
const getQueueTick = (updateMethod) => {
	return () => requestAnimationFrame(updateMethod);
};

const loadLongPress = async () => {
	return await import("/js/dependencies/long-press-event.min.js");
};

const main = {
	hasFocus: true

	, lastRender: 0
	, msPerFrame: Math.floor(1000 / 60)

	, init: async function () {
		if (isMobile) {
			$("#ui-container").addClass("mobile");

			//If we're on an ios device, we need to load longPress since that polyfills contextmenu for us
			if (_.isIos()) {
				await loadLongPress();
			}
		}

		if (window.location.search.includes("hideMonetization")) {
			$("#ui-container").addClass("hideMonetization");
		}

		await client.init();
		await globals.init();
		await locale.init();

		this.loader = await uiFactory.buildFromConfig({
			type: "loader"
			, path: "/ui/templates/loader"
		});
		$("#loader-container").remove();

		await Promise.all([
			resources.init()
			, components.init()
			, sound.init()
		]);

		events.emit("onResourcesLoaded");

		window.onfocus = this.onFocus.bind(this, true);
		window.onblur = this.onFocus.bind(this, false);
		$(window).on("contextmenu", this.onContextMenu.bind(this));

		input.init("#ui-container");
		objects.init();
		renderer.init();

		numbers.init();

		uiFactory.init();
		this.loader.destroy();
		delete this.loader;

		fnQueueTick = getQueueTick(this.update.bind(this));
		fnQueueTick();
	}

	, onFocus: function (hasFocus) {
		//Hack: Later we might want to make it not render when out of focus
		this.hasFocus = true;
		if (!hasFocus) {
			input.resetKeys();
		}
	}

	, onContextMenu: function (e) {
		const allowed = ["txtUsername", "txtPassword"].some((s) => $(e.target).hasClass(s));
		if (!allowed) {
			e.preventDefault();
			return false;
		}
	}

	, update: function () {
		const time = Date.now();
		if (time - this.lastRender < this.msPerFrame - 1) {
			fnQueueTick();
			return;
		}

		input.update();
		objects.update();
		renderer.update();
		uiFactory.update();
		numbers.update();

		renderer.render();

		this.lastRender = time;

		fnQueueTick();
	}
};

export default main;
main.init();
