const cpnInventory = require('./inventory');
const { isItemStackable } = require('./inventory/helpers');

const maxItemsBase = 50;

module.exports = {
	type: 'stash',

	active: false,
	items: [],
	changed: false,

	maxItems: maxItemsBase,

	init: function (blueprint) {
		let items = blueprint.items || [];
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) 
			this.getItem(items[i]);

		delete blueprint.items;

		this.blueprint = blueprint;
	},

	getItem: function (item) {
		//Material?
		let exists = false;
		if (isItemStackable(item)) {
			let existItem = this.items.find(i => i.name === item.name);
			if (existItem) {
				exists = true;
				if (!existItem.quantity)
					existItem.quantity = 1;
				existItem.quantity += (item.quantity || 1);

				//We modify the old object because it gets sent to the client
				item.id = existItem.id;
				item.quantity = existItem.quantity;

				item = existItem;
			}
		}

		//Get next id
		if (!exists) {
			let id = 0;
			let items = this.items;
			let iLen = items.length;
			for (let i = 0; i < iLen; i++) {
				let fItem = items[i];
				if (fItem.id >= id) 
					id = fItem.id + 1;
			}
			item.id = id;
		}

		if (!exists)
			this.items.push(item);
	},

	deposit: function (item) {
		if (!this.active)
			return;
		else if (this.items.length >= this.maxItems) {
			let isStackable = this.items.some(stashedItem => item.name === stashedItem.name && (isItemStackable(stashedItem)));
			if (!isStackable) {
				const message = 'You do not have room in your stash to deposit that item';
				this.obj.social.notifySelf({ message });

				return;
			}
		}
		this.getItem(item);

		this.obj.syncer.setArray(true, 'stash', 'getItems', item);

		this.changed = true;

		return true;
	},

	destroyItem: function (id) {
		let item = this.items.find(i => i.id === id);
		if (!item)
			return;

		this.items.spliceWhere(i => i === item);

		this.obj.syncer.setArray(true, 'stash', 'destroyItems', id);

		this.changed = true;
	},

	withdraw: function (id) {
		if (!this.active)
			return;

		let item = this.items.find(i => i.id === id);
		if (!item)
			return;
		else if (!this.obj.inventory.hasSpace(item)) {
			const message = 'You do not have room in your inventory to withdraw that item';
			this.obj.social.notifySelf({ message });
			
			return;
		}

		this.obj.inventory.getItem(item);
		this.items.spliceWhere(i => i === item);

		this.obj.syncer.setArray(true, 'stash', 'destroyItems', id);

		this.changed = true;
	},

	setActive: function (active) {
		let obj = this.obj;

		this.active = active;
		obj.syncer.set(true, 'stash', 'active', this.active);

		const actionType = active ? 'addActions' : 'removeActions';
		obj.syncer.setArray(true, 'serverActions', actionType, {
			key: 'u',
			action: {
				targetId: obj.id,
				cpn: 'stash',
				method: 'open'
			}
		});

		let msg = 'Press U to access your Shared Stash';
		this.obj.instance.syncer.queue('onGetAnnouncement', {
			src: this.obj.id,
			msg: msg
		}, [obj.serverId]);

		if (this.active && this.items.length > this.maxItems) {
			const message = `You have more than ${this.maxItems} items in your stash. In the future, these items will be lost.`;
			obj.social.notifySelf({ message });
		}
	},

	open: function () {
		const { active, obj } = this;

		if (active)
			obj.instance.syncer.queue('onOpenStash', {}, [obj.serverId]);
	},

	simplify: function (self) {
		if (!self)
			return null;

		return {
			type: 'stash',
			active: this.active,
			items: this.items,
			maxItems: this.maxItems
		};
	},

	serialize: function () {
		return this.items.map(i => cpnInventory.simplifyItem.call({ obj: {} }, i));
	}
};
