const bcrypt = require("bcrypt-nodejs");

const doSaveAll = async (res, config, err, compareResult) => {
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
	// Wait for all zones to clear queues.
	await atlas.returnWhenZonesIdle();
	// Send notification.
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
	// Ask threads to save all data.
	await cons.forceSaveAll();
	// Wait for all threads to get idle again.
	await atlas.returnWhenZonesIdle();
	// HTTP Return value.
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
	bcrypt.compare(config.pwd, storedPassword, doSaveAll.bind(null, res, config));
};
