import events from "/js/system/events.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/overlay/template.html", { raw: true });

export default {
	tpl: template

	, focusEl: null
	, lastZIndex: 0

	, postRender: function () {
		events.on("onShowOverlay", this.onShowOverlay.bind(this));
		events.on("onHideOverlay", this.onHideOverlay.bind(this));
	}

	, onShowOverlay: function (focusEl) {
		this.focusEl = focusEl;
		this.lastZIndex = focusEl.css("z-index");
		focusEl.css("z-index", ~~this.el.css("z-index") + 1);
		this.show();
	}

	, onHideOverlay: function (focusEl) {
		if (!this.focusEl) {
			return;
		}
		if (focusEl[0] !== this.focusEl[0]) {
			return;
		}
		this.focusEl.css("z-index", this.lastZIndex);
		this.hide();
	}
};
