//This lock system is so stupid. But until we rewrite mail (no more auto-fetch)
// We need a way to stop race conditions (listener picking up mail when we just want to getMail normally)
const locks = {};

module.exports = {
	init: function (instance) {
		this.instance = instance;

		this.listen();
	},

	listen: function () {
		io
			.subscribe('mail')
			.then(cursor => {
				cursor.each(async (err, data) => {
					let doc = data.new_val;
					if (!doc)
						return;

					let player = this.instance.objects.objects.find(o => o.name === doc.id && o.player);
					if (!player)
						return;

					if (locks[player.name])
						return;

					locks[player.name] = 1;

					let items = doc.value;
					let inventory = player.inventory;
					let stash = player.stash;

					let sentMessages = [];

					items.forEach(function (r) {
						if (r.removeAll) {
							for (let i = 0; i < inventory.items.length; i++) {
								let item = inventory.items[i];
								if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
									inventory.destroyItem(item.id, item.quantity ? item.quantity : null);
									i--;
								}
							}

							if (stash) {
								for (let i = 0; i < stash.items.length; i++) {
									let item = stash.items[i];
									if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
										stash.destroyItem(item.id);
										i--;
									}
								}
							}
						} else {
							if ((r.msg) && (!sentMessages.some(s => (s === r.msg)))) {
								player.social.notifySelf({
									message: r.msg,
									className: 'color-greenB'
								});

								sentMessages.push(r.msg);
								delete r.msg;
							}

							delete r.pos;
							delete r.quickSlot;
							inventory.getItem(r, false, false, false, true);
						}
					});

					await io.deleteAsync({
						key: doc.id,
						table: 'mail'
					});

					delete locks[player.name];
				});
			});
	},

	getMail: async function (playerName) {
		let items = await io.getAsync({
			key: playerName,
			table: 'mail'
		});

		if (!items || !(items instanceof Array))
			return;

		let player = this.instance.objects.objects.find(o => o.name === playerName && o.player);
		if (!player)
			return;

		if (locks[playerName])
			return;

		locks[playerName] = 1;

		let inventory = player.inventory;
		let stash = player.stash;

		let sentMessages = [];

		items.forEach(function (r) {
			if (r.removeAll) {
				for (let i = 0; i < inventory.items.length; i++) {
					let item = inventory.items[i];
					if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
						inventory.destroyItem(item.id, item.quantity ? item.quantity : null);
						i--;
					}
				}

				if (stash) {
					for (let i = 0; i < stash.items.length; i++) {
						let item = stash.items[i];
						if ((r.nameLike) && (item.name.indexOf(r.nameLike) > -1)) {
							stash.destroyItem(item.id);
							i--;
						}
					}
				}
			} else {
				if ((r.msg) && (!sentMessages.some(s => (s === r.msg)))) {
					player.social.notifySelf({
						message: r.msg,
						className: 'color-greenB'
					});

					sentMessages.push(r.msg);
					delete r.msg;
				}

				delete r.pos;
				delete r.quickSlot;
				inventory.getItem(r, false, false, false, true);
			}
		});

		await io.deleteAsync({
			key: playerName,
			table: 'mail'
		});

		delete locks[playerName];
	},

	sendMail: async function (playerName, items, callback) {
		if (await io.exists({
			key: playerName,
			table: 'mail'
		})) {
			await io.append({
				key: playerName,
				table: 'mail',
				value: items,
				field: 'value'
			});
		} else {
			await io.setAsync({
				key: playerName,
				table: 'mail',
				value: items
			});
		}

		if (callback)
			callback();
	}
};
