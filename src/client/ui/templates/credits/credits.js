import locale from "/js/locale/index.js";
import uiFactory from "/ui/factory.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/credits/template.html");

export default {
	hasClose: true

	, beforeRender: function () {
		this.tpl = locale.localizeHTML(locale.dictionary, template.cloneNode(true));
	}
	, postRender: function () {
		this.find(".btn").on("click", this.buttonHandler.bind(this));
	}
	, afterHide: function () {
		setTimeout(() => this.destroy(), 33);
	}
	, beforeDestroy: function () {
		if (uiFactory.getUi("mainMenu")) {
			// If mainMenu is loaded, do nothing.
			return;
		}
		if (!uiFactory.getUi("login")) { // Open login screen.
			uiFactory.build("login");
		}
	}

	, buttonHandler: function (e) {
		const target = $(e.currentTarget);
		const uiType = target.data("ui");
		if (uiType) {
			const ui = uiFactory.getUi(uiType);
			if (ui) {
				ui.show();
				return;
			}
			uiFactory.build(uiType, {
				modal: true
			});
			return;
		}
		const href = target.data("href");
		if (href) {
			window.open(href, "_blank");
			return;
		}
		if (target.hasClass("btnClose")) {
			return;
		}
		_.log.credits.buttonHandler.error("Target %o couldn't be handled.", target);
	}
};
