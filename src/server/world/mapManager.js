const events = require("../misc/events");
const fileLister = require("../misc/fileLister");

const MAP_DIR = "config/maps";
// Time to keep the last map list before checking again. In seconds.
const BUFFER_TTL = 60;

const getMapInfos = function(path, name) {
	const map = {
		name
		, path
		, instanced: false
	};
	const mapManifest = fileLister.getJSON(`${path}/${name}/manifest.json`);
	if (mapManifest) {
		_.assign(map, mapManifest);
	}
	return map;
};

let lastCheck;
let mapListCache;
const getMapList = function (params) {
	const time = Date.now();
	if (mapListCache && time - lastCheck < BUFFER_TTL * 1000) {
		return mapListCache;
	}
	mapListCache = fileLister.getDirectories("config/maps").map((f) => getMapInfos(MAP_DIR, f));
	lastCheck = time;
	return mapListCache;
};

module.exports = {
	init: () => {
		const mapList = getMapList();
		events.emit("onBeforeGetMapList", mapList);
	}
	, getMapList
};
