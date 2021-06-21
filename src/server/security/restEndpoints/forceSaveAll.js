const bcrypt = require('bcrypt-nodejs');

const doSaveAll = async (res, config, err, compareResult) => {
	if (!compareResult)
		return;

	const char = await io.getAsync({
		table: 'character',
		key: config.username
	});

	if (!char)
		return;

	const auth = (char.components || []).find(c => c.type === 'auth');
	if (!auth)
		return;

	if (auth.accountLevel < 9)
		return;

	await atlas.returnWhenZonesIdle();

	cons.emit('event', {
		event: 'onGetMessages',
		data: {
			messages: [{
				class: 'color-blueA',
				message: config.msg,
				type: 'chat'
			}]
		}
	});

	cons.forceSaveAll();

	res.jsonp({
		success: true
	});
};

module.exports = async (req, res, next) => {
	let config = {};

	let pars = req.originalUrl.split('?').pop().split('&');
	pars.forEach(p => {
		let [par, val = ''] = p.split('=');
		config[par] = val
			.split('%20')
			.join(' ');
	});

	if (['msg', 'username', 'pwd', 'character'].some(p => !config[p]))
		return;

	let storedPassword = await io.getAsync({
		key: config.username,
		table: 'login',
		noParse: true
	});

	bcrypt.compare(config.pwd, storedPassword, doSaveAll.bind(null, res, config));
};

