const events = require("../misc/events");

module.exports = {
	mappings: {

	}

	, init: function () {
		events.emit("onBeforeGetFactions", this.mappings);
	}

	, getFaction: function (id) {
		const mapping = this.mappings[id];
		if (mapping) {
			return _.safeRequire(module, "./" + mapping);
		} else {
			return _.safeRequire(module, "./factions/" + id);
		}
	}

};
