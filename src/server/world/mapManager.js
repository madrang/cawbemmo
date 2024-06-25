//Imports
const events = require("../misc/events");

//Internals
const mapList = [
	{
		name: "depanneur"
		, path: "config/maps"
	}
	, {
		name: "town"
		, path: "config/maps"
	}
	, {
		name: "admin"
		, path: "config/maps"
	}
];

//Helpers
const init = () => {
	events.emit("onBeforeGetMapList", mapList);
};

//Exports
module.exports = {
	init
	, mapList
};
