import globals from "/js/system/globals.js";
import browserStorage from "/js/system/browserStorage.js";
import uiFactory from "/ui/factory.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/changeLog/template.html", { raw: true });

export default {
	tpl: template
	, centered: true

	, postRender: function () {
		const { clientConfig: { changeLog: { content, version } } } = globals;

		const elHeading = this.find(".heading");
		elHeading.html(`${elHeading.html()} (v${version})`);

		const morphedContent = content.replaceAll("\n", "<br />");
		this.find(".content").html(morphedContent);

		this.find(".btnNext").on("click", this.onContinueClick.bind(this, version));
	}

	, onContinueClick: function (version) {
		browserStorage.set("changelog_version", version);
		this.destroy();
		uiFactory.build("characters");
	}
};
