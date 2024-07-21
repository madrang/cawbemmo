require.config({
	baseUrl: ""
	, waitSeconds: 120
	, paths: {
		assign: "/common/assign"
		, text: "/js/dependencies/text.min"
		, html: "/plugins/html"
		, css: "/js/dependencies/css.min"
		, helpers: "/js/misc/helpers"
	}
	, shim: {
		helpers: {
			deps: [
				"assign"
			]
			, exports: "_"
		}
	}
});

require([
	"helpers"
], function (
	glExport
) {
	_.log.jasmine.info("Ready!");
});
