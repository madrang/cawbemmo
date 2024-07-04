let fs = require("fs");
let fsPath = require("path");

module.exports = {
	getFiles: function (path) {
		return fs.readdirSync(path).filter((file) => !fs.statSync(fsPath.join(path, file)).isDirectory());
	}

	, getDirectories: function (path) {
		try {
			return fs.readdirSync(path).filter((file) => fs.statSync(fsPath.join(path, file)).isDirectory());
		} catch (e) {
			_.log.getDirectories.error(e);
		}
		return [];
	}
};
