const events = require("../misc/events");

const restEndpoints = {
	info: require("./restEndpoints/info.js")
	, adminForceSave: require("./restEndpoints/forceSaveAll.js")
	, messageAll: require("./restEndpoints/messageAll.js")
};

module.exports = {
	init: function (app) {
		events.emit("onBeforeRegisterRestEndpoints", restEndpoints);
		for (const [ route, handler ] of Object.entries(restEndpoints)) {
			app.get(`/${route}`, handler);
		}
	}

	, willHandle: function (url) {
		return Object.keys(restEndpoints).some((k) => url.includes(`/${k}`));
	}
};
