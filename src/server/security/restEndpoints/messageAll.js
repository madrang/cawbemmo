const bcrypt = require("bcrypt-nodejs");

const doMessageAll = async (res, config, err, compareResult) => {
	if (!compareResult) {
		return;
	}
	const accountInfo = await io.getAsync({
		table: "accountInfo"
		, key: config.username
	});
	if (!accountInfo || !accountInfo.level || accountInfo.level < 9) {
		return;
	}
	cons.emit("event", {
		event: "onGetMessages"
		, data: {
			messages: [{
				class: "color-blueA"
				, message: config.msg
				, type: "chat"
			}]
		}
	});
	res.jsonp({
		success: true
	});
};

module.exports = async (req, res, next) => {
	const config = {};

	let pars = req.originalUrl.split("?").pop().split("&");
	pars.forEach((p) => {
		let [par, val = ""] = p.split("=");
		config[par] = val
			.split("%20")
			.join(" ");
	});

	if (["msg", "username", "pwd"].some((p) => !config[p])) {
		return;
	}

	const storedPassword = await io.getAsync({
		key: config.username
		, table: "login"
		, noParse: true
	});
	bcrypt.compare(config.pwd, storedPassword, doMessageAll.bind(null, res, config));
};
