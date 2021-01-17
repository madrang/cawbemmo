const bcrypt = require('bcrypt-nodejs');
const messages = require('../misc/messages');
const skins = require('../config/skins');
const roles = require('../config/roles');
const profanities = require('../misc/profanities');
const fixes = require('../fixes/fixes');
const spirits = require('../config/spirits');
const ga = require('../security/ga');
const events = require('../misc/events');

const checkLoginRewards = require('./auth/checkLoginRewards');

module.exports = {
	type: 'auth',

	username: null,
	charname: null,
	characters: {},
	characterList: [],
	stash: null,
	accountInfo: null,

	customChannels: [],

	play: async function (data) {
		if (!this.username)
			return;

		let character = this.characters[data.data.name];
		if (!character)
			return;
		else if (character.permadead)
			return;

		character.stash = this.stash;
		character.account = this.username;

		this.charname = character.name;

		checkLoginRewards(this, data, character, this.onSendRewards.bind(this, data, character));

		cons.modifyPlayerCount(1);
	},

	onSendRewards: async function (data, character) {
		await io.setAsync({
			key: this.username,
			table: 'accountInfo',
			value: this.accountInfo,
			serialize: true
		});

		this.obj.player.sessionStart = +new Date();
		this.obj.player.spawn(character, data.callback);

		let prophecies = this.obj.prophecies ? this.obj.prophecies.simplify().list : [];
		await leaderboard.setLevel(character.name, this.obj.stats.values.level, prophecies);
	},

	doSave: async function (callback, saveStash = true) {	
		const simple = this.obj.getSimple(true, true);
		simple.components.spliceWhere(f => (f.type === 'stash'));

		await io.setAsync({
			key: this.charname,
			table: 'character',
			value: simple,
			clean: true,
			serialize: true
		});

		if (saveStash)
			await this.doSaveStash();

		if (callback)
			callback();
	},

	doSaveStash: async function () {
		await io.setAsync({
			key: this.username,
			table: 'stash',
			value: this.obj.stash.serialize(),
			clean: true,
			serialize: true
		});
	},

	simplify: function () {
		return {
			type: 'auth',
			username: this.username,
			charname: this.charname,
			skins: this.skins
		};
	},

	getCharacterList: async function (data) {
		if (!this.username)
			return;

		this.characterList = await io.getAsync({
			key: this.username,
			table: 'characterList',
			isArray: true
		});

		let res = this.characterList.map(c => ({
			name: c.name ? c.name : c,
			level: leaderboard.getLevel(c.name ? c.name : c)
		}));

		data.callback(res);
	},

	getCharacter: async function (data) {
		let charName = data.data.name;
		if (!this.characterList.some(c => (c.name === charName || c === charName)))
			return;

		let character = await io.getAsync({
			key: charName,
			table: 'character',
			clean: true
		});

		events.emit('onAfterGetCharacter', {
			obj: this.obj,
			character
		});

		fixes.fixCharacter(character);

		character.cell = skins.getCell(character.skinId);
		character.sheetName = skins.getSpritesheet(character.skinId);

		this.characters[charName] = character;

		await this.getCustomChannels(character);
		await this.getStash();

		this.verifySkin(character);

		data.callback(character);
	},

	getCustomChannels: async function (character) {
		this.customChannels = await io.getAsync({
			key: character.name,
			table: 'customChannels',
			isArray: true
		});

		let social = character.components.find(c => (c.type === 'social'));
		this.customChannels = fixes.fixCustomChannels(this.customChannels);
		if (social)
			social.customChannels = this.customChannels;
	},

	getStash: async function (data, character) {
		this.stash = await io.getAsync({
			key: this.username,
			table: 'stash',
			isArray: true,
			clean: true
		});

		fixes.fixStash(this.stash);

		events.emit('onAfterGetStash', {
			obj: this.obj,
			stash: this.stash
		});
	},

	getSkins: async function (character) {
		this.skins = await io.getAsync({
			key: this.username,
			table: 'skins',
			isArray: true
		});

		fixes.fixSkins(this.username, this.skins);
	},

	getSkinList: function (msg) {
		let list = [...this.skins, ...roles.getSkins(this.username)];
		let skinList = skins.getSkinList(list);

		msg.callback(skinList);
	},

	saveSkin: async function (skinId) {
		if (!this.skins) {
			this.getSkins({
				callback: this.saveSkin.bind(this, skinId)
			});

			return;
		}

		this.skins.push(skinId);

		await io.setAsync({
			key: this.username,
			table: 'skins',
			value: this.skins,
			serialize: true
		});
	},

	onSaveSkin: function () {

	},

	verifySkin: function (character) {
		let list = [...this.skins, ...roles.getSkins(this.username)];
		let skinList = skins.getSkinList(list);

		if (!skinList.some(s => (s.id === character.skinId))) {
			character.skinId = '1.0';
			character.cell = skins.getCell(character.skinId);
			character.sheetName = skins.getSpritesheet(character.skinId);
		}
	},

	doesOwnSkin: function (skinId) {
		let list = [...this.skins, ...roles.getSkins(this.username)];
		let skinList = skins.getSkinList(list);

		return skinList.some(s => s.id === (skinId + '') || s === '*');
	},

	login: async function (msg) {
		let credentials = msg.data;

		if (credentials.username === '' || credentials.password === '') {
			msg.callback(messages.login.allFields);
			return;
		}

		let storedPassword = await io.getAsync({
			key: credentials.username,
			table: 'login',
			noParse: true
		});

		bcrypt.compare(credentials.password, storedPassword, this.onLogin.bind(this, msg, storedPassword));
	},

	onLogin: async function (msg, storedPassword, err, compareResult) {
		if (!compareResult) {
			msg.callback(messages.login.incorrect);
			return;
		}
		
		this.username = msg.data.username;
		cons.logOut(this.obj);

		this.initTracker();

		await this.getSkins();

		this.accountInfo = await io.getAsync({
			key: msg.data.username,
			table: 'accountInfo',
			noDefault: true
		}) || {
			loginStreak: 0
		};

		msg.callback();
	},

	initTracker: function () {
		this.gaTracker = ga.connect(this.username);
	},

	track: function (category, action, label, value = 1) {
		process.send({
			method: 'track',
			serverId: this.obj.serverId,
			obj: {
				category,
				action,
				label,
				value
			}
		});
	},

	register: async function (msg) {
		let credentials = msg.data;

		if ((credentials.username === '') || (credentials.password === '')) {
			msg.callback(messages.login.allFields);
			return;
		}

		let illegal = ["'", '"', '/', '(', ')', '[', ']', '{', '}', ':', ';', '<', '>', '+', '?'];
		for (let i = 0; i < illegal.length; i++) {
			if (credentials.username.indexOf(illegal[i]) > -1) {
				msg.callback(messages.login.illegal);
				return;
			}
		}

		let exists = await io.getAsync({
			key: credentials.username,
			ignoreCase: true,
			table: 'login',
			noDefault: true,
			noParse: true
		});

		if (exists) {
			msg.callback(messages.login.exists);
			return;
		}

		bcrypt.hash(credentials.password, null, null, this.onHashGenerated.bind(this, msg));
	},

	onHashGenerated: async function (msg, err, hashedPassword) {
		await io.setAsync({
			key: msg.data.username,
			table: 'login',
			value: hashedPassword
		});

		this.accountInfo = {
			loginStreak: 0
		};

		await io.setAsync({
			key: msg.data.username,
			table: 'characterList',
			value: [],
			serialize: true
		});

		this.username = msg.data.username;
		cons.logOut(this.obj);

		await this.getSkins();

		msg.callback();
	},

	createCharacter: async function (msg) {
		let data = msg.data;
		let name = data.name;

		let error = null;

		if (name.length < 3 || name.length > 12)
			error = messages.createCharacter.nameLength;
		else if (!profanities.isClean(name))
			error = messages.login.invalid;
		else if (name.indexOf('  ') > -1)
			msg.callback(messages.login.invalid);
		else if (!spirits.list.includes(data.class))
			return;

		let nLen = name.length;
		for (let i = 0; i < nLen; i++) {
			let char = name[i].toLowerCase();
			let valid = [
				'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
			];

			if (!valid.includes(char)) {
				error = messages.login.invalid;
				break;
			}
		}

		if (error) {
			msg.callback(error);
			return;
		}

		let exists = await io.getAsync({
			key: name,
			ignoreCase: true,
			table: 'character',
			noDefault: true
		});

		if (exists) {
			msg.callback(messages.login.charExists);
			return;
		}

		let obj = this.obj;

		extend(obj, {
			name: name,
			skinId: data.skinId,
			class: data.class,
			cell: skins.getCell(data.skinId),
			sheetName: skins.getSpritesheet(data.skinId),
			x: null,
			y: null
		});

		let simple = this.obj.getSimple(true);

		this.verifySkin(simple);
		
		let prophecies = (data.prophecies || []).filter(p => p);
		
		simple.components.push({
			type: 'prophecies',
			list: prophecies
		}, {
			type: 'social',
			customChannels: this.customChannels
		});

		await io.setAsync({
			key: name,
			table: 'character',
			value: simple,
			serialize: true
		});

		this.characters[name] = simple;
		this.characterList.push(name);
		
		await io.setAsync({
			key: this.username,
			table: 'characterList',
			value: this.characterList,
			serialize: true
		});

		this.initTracker();

		this.play({
			data: {
				name: name
			},
			callback: msg.callback
		});
	},

	deleteCharacter: async function (msg) {
		let data = msg.data;

		if ((!data.name) || (!this.username))
			return;

		if (!this.characterList.some(c => ((c.name === data.name) || (c === data.name)))) {
			msg.callback([]);
			return;
		}

		await io.deleteAsync({
			key: data.name,
			table: 'character'
		});

		let name = data.name;

		this.characterList.spliceWhere(c => (c.name === name || c === name));
		let characterList = this.characterList
			.map(c => ({
				name: c.name ? c.name : c,
				level: leaderboard.getLevel(c.name ? c.name : c)
			}));

		await io.setAsync({
			key: this.username,
			table: 'characterList',
			value: characterList,
			serialize: true
		});

		await leaderboard.deleteCharacter(name);

		let result = this.characterList
			.map(c => ({
				name: c.name ? c.name : c,
				level: leaderboard.getLevel(c.name ? c.name : c)
			}));

		msg.callback(result);
	},

	permadie: function () {
		this.obj.permadead = true;
		this.doSave(this.onPermadie.bind(this));
	},

	onPermadie: function () {
		process.send({
			method: 'object',
			serverId: this.obj.serverId,
			obj: {
				dead: true
			}
		});
	}
};
