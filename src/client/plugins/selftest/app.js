require.config({
	baseUrl: ""
	, waitSeconds: 60
	, paths: {
		assign: "/common/assign"
		, "js/system/events": "/js/system/events"
		, socket: "/js/dependencies/socket.io.min"
		, jquery: "/js/dependencies/jquery.slim.min"
		, text: "/js/dependencies/text.min"
		, html: "/plugins/html"
		, css: "/js/dependencies/css.min"
		, helpers: "/js/misc/helpers"
	}
	, shim: {
		howler: {
			exports: "howl"
		}
		, socket: {
			exports: "io"
		}
		, jquery: {
			exports: "$"
		}
		, helpers: {
			deps: [
				"assign"
			]
			, exports: "_"
		}
	}
});
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15 * 1000;
