define([
	"ui/factory"
	, "html!ui/templates/changeLog/template"
	, "css!ui/templates/changeLog/styles"
	, "js/system/globals"
	, "js/system/browserStorage"
], function (
	uiFactory,
	template,
	styles,
	globals,
	browserStorage
) {
	return {
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
});
