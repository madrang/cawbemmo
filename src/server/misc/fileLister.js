let fs = require('fs');
let fsPath = require('path');

module.exports = {
	getFolder: function (path) {
		return fs.readdirSync(path).filter((file) => !fs.statSync(fsPath.join(path, file)).isDirectory());
	},

	getFolderList: function (path) {
		try {
			return fs.readdirSync(path).filter((file) => fs.statSync(fsPath.join(path, file)).isDirectory());
		} catch (e) {
			_.log.getFolderList.error(e);
		}
		return [];
	}
};
