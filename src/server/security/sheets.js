const { GoogleSpreadsheet: googleSheets } = require('google-spreadsheet');
let creds = require('./creds');
let sheetsConfig = require('./sheetsConfig');

module.exports = {
	doc: null,
	sheet: null,

	records: null,

	init: async function () {
		if (sheetsConfig.roles) {
			this.update = function () {};
			this.onGetRows(null, sheetsConfig.roles);
			return;
		}

		this.doc = new googleSheets(sheetsConfig.sheetId);
		await this.doc.useServiceAccountAuth(creds);
		await this.loadInfo();
	},

	loadInfo: async function () {
		await this.doc.loadInfo();
		this.onGetInfo();
	},

	onGetInfo: function () {
		this.sheet = this.doc.sheetsByIndex[0];

		if (!this.sheet) {
			setTimeout(this.loadInfo.bind(this), 300000);
			return;
		}

		this.update();
	},

	getRecord: function (name) {
		return (this.records || []).find(r => (r.username === name));
	},

	onGetRows: function (err, rows) {
		if (rows) {
			try {
				let records = (rows || []).map(function (r) {
					let o = {};
					Object.keys(r).forEach(function (p) {
						if (['id', 'app:edited', '_links', '_xml', 'save', 'del'].indexOf(p) > -1)
							return;

						o[p] = r[p];
					});

					o.messageStyle = o.messagestyle;
					delete o.messagestyle;
					o.messagePrefix = o.messageprefix;
					delete o.messageprefix;

					o.extraStashSlots = ~~o.extrastashslots;
					o.level = ~~o.level;

					if (typeof (o.items) === 'string')
						o.items = JSON.parse(o.items || '[]');
					if (typeof (o.skins) === 'string')
						o.skins = JSON.parse(o.skins || '[]');

					return o;
				});

				this.records = records;
			} catch (e) {}
		}

		setTimeout(this.update.bind(this), 300000);
	},

	update: async function () {
		try {
			const records = await this.sheet.getRows();
			this.onGetRows(null, records);
		} catch (e) {
			setTimeout(this.update.bind(this), 300000);
		}
	}
};
