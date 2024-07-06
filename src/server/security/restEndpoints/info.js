const { version, nodeEnv, realmName } = require("../../config/serverConfig");

module.exports = (req, res, next) => {
	res.jsonp({
		version
		, type: nodeEnv
		, name: realmName
		, players: cons.players.length
	});
};
