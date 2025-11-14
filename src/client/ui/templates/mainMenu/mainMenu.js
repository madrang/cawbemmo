import events from "/js/system/events.js";
import renderer from "/js/rendering/renderer.js";
import factory from "/ui/factory.js";
//import objects from "/js/objects/objects.js";
import client from "/js/system/client.js";
import sound from "/js/sound/sound.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/mainMenu/template.html", { raw: true });

export default {
	tpl: template

	, modal: true

	, hasClose: true

	, postRender: function () {
		this.onEvent("onCloseOptions", this.show.bind(this));
		this.onEvent("onShowMainMenu", this.show.bind(this));

		this.el.find(".btnOptions").on("click", this.openOptions.bind(this));
		this.el.find(".btnCharSelect").on("click", this.charSelect.bind(this));
		this.el.find(".btnLogOut").on("click", this.logOut.bind(this));
		this.el.find(".btnPatreon").on("click", this.patreon.bind(this));

		this.onEvent("onResize", this.onResize.bind(this));
		this.onEvent("onAction", this.onAction.bind(this));
	}

	, openOptions: function () {
		if (isMobile) {
			this.el.removeClass("active");
		}

		events.emit("onOpenOptions");
	}

	, patreon: function () {
		window.open("https://patreon.com/bigbadwaffle", "_blank");
	}

	, charSelect: async function () {
		this.el.addClass("disabled");

		await client.moduleProxy.cons.unzone();

		events.emit("destroyAllObjects");
		events.emit("resetRenderer");
		events.emit("resetPhysics");

		renderer.buildTitleScreen();
		sound.unload();

		events.emit("onShowCharacterSelect");

		factory.exitGame();

		factory.build("characters", {});
	}

	, onResize: function () {
		let isFullscreen = (window.innerHeight === screen.height);
		if (isFullscreen) {
			this.el.find(".btnScreen").html("Windowed");
		} else {
			this.el.find(".btnScreen").html("Fullscreen");
		}
	}

	, onAfterShow: function () {
		this.onResize();
	}

	, beforeHide: function () {
		this.onResize();
	}

	, logOut: function () {
		window.location = window.location;
	}

	, onAction: function (action) {
		if (action === "mainmenu") {
			this.toggle();
		}
	}
};
