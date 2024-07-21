const { version, nodeEnv, realmName } = require("../../config/serverConfig");

const getInfos = (req, res, next) => {
	res.jsonp({
		version
		, type: nodeEnv
		, name: realmName
		, players: cons.players.length
	});
};

module.exports = {
	get: getInfos
};
