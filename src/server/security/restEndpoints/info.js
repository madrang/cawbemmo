const { version,name } = require("../../config/serverConfig");

module.exports = (req, res, next) => {
	res.jsonp({
		v: version
		, m: name
		, p: cons.players.length
	});
};
