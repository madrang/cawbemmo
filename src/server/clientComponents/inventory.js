define([
	'js/system/events'
], function (
	events
) {
	return {
		type: 'inventory',

		items: [],

		init: function (blueprint) {
			events.emit('onGetItems', this.items);
		},
		extend: function (blueprint) {
			let rerender = false;

			if (blueprint.destroyItems) {
				rerender = true;
				events.emit('onDestroyItems', blueprint.destroyItems, this.items);
			}

			if (blueprint.getItems) {
				let items = this.items;
				let newItems = blueprint.getItems || [];
				let nLen = newItems.length;

				for (let i = 0; i < nLen; i++) {
					let nItem = newItems[i];
					let nId = nItem.id;

					let findItem = items.find(f => f.id === nId);
					if (findItem) {
						if (!rerender) {
							rerender = (
								(findItem.pos !== nItem.pos) ||
								(findItem.eq !== nItem.eq) ||
								(findItem.active !== nItem.active) ||
								(findItem.quickSlot !== nItem.quickSlot) || 
								(findItem.quantity !== nItem.quantity)
							);
						}

						for (let p in findItem) 
							delete findItem[p];

						$.extend(true, findItem, nItem);

						newItems.splice(i, 1);
						i--;
						nLen--;
					} else {
						rerender = true;
						nItem.isNew = true;
					}
				}

				this.items.push.apply(this.items, blueprint.getItems || []);

				events.emit('onGetItems', this.items, rerender);
			}
		},

		equipItemErrors: function (item) {
			let errors = [];
			let stats = this.obj.stats.values;

			if (item.level > stats.level)
				errors.push('level');

			if (item.requires && item.requires[0] && stats[item.requires[0].stat] < item.requires[0].value)
				errors.push('stats');

			if (item.factions) {
				if (item.factions.some(f => f.noEquip))
					errors.push('faction');
			}

			return errors;
		},

		canEquipItem: function (item) {
			return (this.equipItemErrors(item).length === 0);
		}
	};
});
