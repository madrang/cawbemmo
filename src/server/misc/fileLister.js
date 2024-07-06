let fs = require("fs");
let fsPath = require("path");

module.exports = {
	getDirectories: function (path) {
		try {
			return fs.readdirSync(path).filter((file) => fs.statSync(fsPath.join(path, file)).isDirectory());
		} catch (e) {
			_.log.getDirectories.error(e);
		}
		return [];
	}

	, getFiles: function (path) {
		return fs.readdirSync(path).filter((file) => fs.statSync(fsPath.join(path, file)).isFile());
	}

	, getJSON: function (path) {
		if (fs.existsSync(path)) {
			return JSON.parse(fs.readFileSync(path, "utf8"));
		}
	}
};
