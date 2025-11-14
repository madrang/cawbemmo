import globals from "/js/system/globals.js";
import browserStorage from "/js/system/browserStorage.js";
import uiFactory from "/ui/factory.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/terms/template.html", { raw: true });

return {
	tpl: template
	, centered: true

	, postRender: function () {
		const { clientConfig: { tos: { content, version } } } = globals;

		const elHeading = this.find(".heading");
		elHeading.html(`${elHeading.html()} (v${version})`);

		const morphedContent = content.replaceAll("\n", "<br />");
		this.find(".content").html(morphedContent);

		this.find(".btnDecline").on("click", this.onDeclineClick.bind(this));
		this.find(".btnAccept").on("click", this.onAcceptClick.bind(this, version));
	}

	, onDeclineClick: function () {
		browserStorage.set("tos_accepted_version", null);
		window.location = window.location;
	}

	, onAcceptClick: function (version) {
		browserStorage.set("tos_accepted_version", version);
		this.destroy();
		uiFactory.build("characters");
	}
};
