const { version,name } = require("../../config/serverConfig");

module.exports = (req, res, next) => {
	res.jsonp({
		v: version
		, n: name
		, p: cons.players.length
	});
};
