//import events from "/js/system/events.js";
import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/help/template.html", { raw: true });

export default {
	tpl: template

	, modal: true
	, hasClose: true

	, isFlex: true

	, postRender: function () {
		this.onEvent("keydown", this.onKeyDown.bind(this));
		this.onEvent("onShowHelp", this.toggle.bind(this));

		this.on(".toslink", "click", this.redirect.bind(this));
	}

	, onKeyDown: function (e) {
		if (e.key === "h") {
			this.toggle();
		}
	}

	, redirect: function (e) {
		let currentLocation = $(e.currentTarget).attr("location");
		window.open(currentLocation, "_blank");
	}
};
