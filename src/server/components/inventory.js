//System
const events = require("../misc/events");

//External Helpers
const generator = require("../items/generator");
const salvager = require("../items/salvager");
const classes = require("../config/spirits");
const Factions = require("../config/factions");
const itemEffects = require("../items/itemEffects");

//Helpers
const simplifyItem = require("./inventory/simplifyItem");
const getItem = require("./inventory/getItem");
const dropBag = require("./inventory/dropBag");
const useItem = require("./inventory/useItem");
const { isItemStackable } = require("./inventory/helpers");

const SPRITE_CHEST_CELL_IDS = [
	98			// 0 - Normal
	, 99		// 1
	, 256		// 2
	, 100		// 3
	, 101		// 4 - Rare
];

//Component
module.exports = {
	type: "inventory"

	, inventorySize: 50
	, items: []

	, blueprint: null

	, init: function (blueprint, isTransfer) {
		let items = blueprint.items || [];
		let iLen = items.length;

		//Spells should be sorted so they're EQ'd in the right order
		items.sort(function (a, b) {
			let aId = a.has("spellId") ? ~~a.spellId : 9999;
			let bId = b.has("spellId") ? ~~b.spellId : 9999;
			return (aId - bId);
		});

		for (let i = 0; i < iLen; i++) {
			let item = items[i];
			if ((item.pos >= this.inventorySize) || (item.eq)) {
				delete item.pos;
			}

			while (item.name.indexOf("''") > -1) {
				item.name = item.name.replace("''", "'");
			}
		}

		this.hookItemEvents(items);

		//Hack to skip attr checks on equip
		let oldFn = this.canEquipItem;
		this.canEquipItem = () => {
			return true;
		};

		for (let i = 0; i < iLen; i++) {
			let item = items[i];
			let pos = item.has("pos") ? item.pos : null;

			let newItem = this.getItem(item, true, true);
			newItem.pos = pos;
		}

		//Hack to skip attr checks on equip
		this.canEquipItem = oldFn.bind(this);

		if ((this.obj.player) && (!isTransfer) && (this.obj.stats.values.level === 1)) {
			this.getDefaultAbilities();
		}

		delete blueprint.items;

		this.blueprint = blueprint;

		if (this.obj.equipment) {
			this.obj.equipment.unequipAttrRqrGear();
		}
	}

	, transfer: function () {
		this.hookItemEvents();
	}

	, save: function () {
		return {
			type: "inventory"
			, items: this.items.map(this.simplifyItem.bind(this))
		};
	}

	, simplify: function (self) {
		if (!self) {
			return null;
		}

		return {
			type: "inventory"
			, items: this.items.map(this.simplifyItem.bind(this))
		};
	}

	, simplifyItem: function (item) {
		return simplifyItem(this, item);
	}

	, update: function () {
		for (const item of this.items) {
			if (!item.cd) {
				continue;
			}
			item.cd--;
			this.obj.syncer.setArray(true, "inventory", "getItems", item);
		}
	}

	//forceEq is set by the equipment component to force the ability to be learnt since the item is already EQd
	// otherwise the first if check would fail
	, learnAbility: function ({ itemId, slot, bypassEqCheck = false }) {
		let item = this.findItem(itemId);
		let statValues = this.obj.stats.values;
		if (!item || (item.eq && !bypassEqCheck)) {
			return;
		} else if (!item.spell) {
			item.eq = false;
			return;
		} else if (item.level > statValues.level) {
			item.eq = false;
			return;
		}

		let learnMsg = {
			success: true
			, item: item
		};
		this.obj.fireEvent("beforeLearnAbility", learnMsg);
		if (!learnMsg.success) {
			const message = learnMsg.msg || "you cannot learn that ability";
			this.obj.social.notifySelf({ message });
			return;
		}
		let spellbook = this.obj.spellbook;

		if ((item.slot === "twoHanded") || (item.slot === "oneHanded")) {
			slot = 0;
		} else if (!slot) {
			slot = 4;
			for (let i = 1; i <= 4; i++) {
				if (!this.items.some((j) => (j.runeSlot === i))) {
					slot = i;
					break;
				}
			}
		}

		let currentEq = this.items.find((i) => (i.runeSlot === slot));
		if (currentEq) {
			spellbook.removeSpellById(slot);
			delete currentEq.eq;
			delete currentEq.runeSlot;
			this.setItemPosition(currentEq.id);
			this.obj.syncer.setArray(true, "inventory", "getItems", currentEq);
		}

		item.eq = true;
		item.runeSlot = slot;
		delete item.pos;

		spellbook.addSpellFromRune(item.spell, slot);
		this.obj.syncer.setArray(true, "inventory", "getItems", item);
	}

	, splitStack: function (msg) {
		let { stackSize = 1 } = msg;
		stackSize = ~~stackSize;

		let item = this.findItem(msg.itemId);
		if (!item || !item.quantity || item.quantity <= stackSize || stackSize < 1 || item.quest) {
			return;
		}

		const hasSpace = this.hasSpace(item, true);
		if (!hasSpace) {
			this.notifyNoBagSpace();
			return;
		}

		let newItem = _.assign({}, item);
		item.quantity -= stackSize;
		newItem.quantity = stackSize;

		this.getItem(newItem, true, true);

		this.obj.syncer.setArray(true, "inventory", "getItems", item);
	}

	, combineStacks: function (msg) {
		let fromItem = this.findItem(msg.fromId);
		let toItem = this.findItem(msg.toId);

		const failure = (
			!fromItem ||
			!toItem ||
			fromItem.name !== toItem.name ||
			!isItemStackable(fromItem) ||
			!isItemStackable(toItem)
		);

		if (failure) {
			return;
		}

		toItem.quantity += fromItem.quantity;
		this.obj.syncer.setArray(true, "inventory", "getItems", toItem);
		this.destroyItem({ itemId: fromItem.id }, null, true);
	}

	, useItem: function ({ itemId }) {
		useItem(this, itemId);
	}

	, unlearnAbility: function (itemId) {
		if (itemId.has("itemId")) {
			itemId = itemId.itemId;
		}

		let item = this.findItem(itemId);
		if (!item) {
			return;
		} else if (!item.spell) {
			item.eq = false;
			return;
		}

		let spellbook = this.obj.spellbook;
		spellbook.removeSpellById(item.runeSlot);
		delete item.eq;
		delete item.runeSlot;
		if (!item.slot) {
			this.setItemPosition(itemId);
		}
		this.obj.syncer.setArray(true, "inventory", "getItems", item);
	}

	, stashItem: async function ({ itemId }) {
		const item = this.findItem(itemId);
		if (!item || item.quest || item.noStash) {
			return;
		}

		delete item.pos;

		const stash = this.obj.stash;
		const clonedItem = _.assign({}, item);
		const success = await stash.deposit(clonedItem);
		if (!success) {
			return;
		}

		this.destroyItem({ itemId: itemId }, null, true);
	}

	, salvageItem: function ({ itemId }) {
		let item = this.findItem(itemId);
		if (!item || item.material || item.quest || item.noSalvage || item.eq) {
			return;
		}
		const messages = [];

		let items = salvager.salvage(item);

		this.destroyItem({ itemId: itemId });

		for (const material of items) {
			this.getItem(material, true, false, false, true);

			messages.push({
				className: "q" + material.quality
				, message: "salvage (" + material.name + " x" + material.quantity + ")"
			});
		}
		this.obj.social.notifySelfArray(messages);
	}

	, destroyItem: function ({ itemId }, amount, force) {
		let item = this.findItem(itemId);
		if (!item || (item.noDestroy && !force)) {
			return;
		}

		amount = amount || item.quantity;

		if (item.eq) {
			this.obj.equipment.unequip({ itemId });
		}

		if ((item.quantity) && (amount)) {
			item.quantity -= amount;
			if (item.quantity <= 0) {
				this.items.spliceWhere((i) => i.id === itemId);
				this.obj.syncer.setArray(true, "inventory", "destroyItems", itemId);
			} else {
				this.obj.syncer.setArray(true, "inventory", "getItems", item);
			}
		} else {
			this.items.spliceWhere((i) => i.id === itemId);
			this.obj.syncer.setArray(true, "inventory", "destroyItems", itemId);
			this.obj.syncer.deleteFromArray(true, "inventory", "getItems", (i) => i.id === itemId);
		}

		this.obj.fireEvent("afterDestroyItem", item, amount);
		events.emit("afterPlayerDestroyItem", this.obj, item, amount);

		return item;
	}

	, dropItem: function ({ itemId }) {
		let item = this.findItem(itemId);
		if ((!item) || (item.noDrop) || (item.quest)) {
			return;
		}

		if (item.has("quickSlot")) {
			this.obj.equipment.setQuickSlot({
				itemId: null
				, slot: item.quickSlot
			});

			delete item.quickSlot;
		}

		delete item.pos;

		//Find close open position
		let x = this.obj.x;
		let y = this.obj.y;
		let dropCell = this.obj.instance.physics.getOpenCellInArea(x - 1, y - 1, x + 1, y + 1);
		if (!dropCell) {
			return;
		}

		if (item.eq) {
			this.obj.equipment.unequip(itemId);
		}

		this.items.spliceWhere((i) => i.id === itemId);

		this.obj.syncer.setArray(true, "inventory", "destroyItems", itemId);

		this.createBag(dropCell.x, dropCell.y, [item]);

		events.emit("afterPlayerDropItem", this.obj, item);
	}

	, moveItem: function ({ moveMsgs }) {
		moveMsgs.forEach(({ itemId, targetPos }) => {
			let item = this.findItem(itemId);
			if (!item) {
				return;
			}

			item.pos = targetPos;
		});
	}

	, hookItemEvents: function (items) {
		items = items || this.items;
		if (!items.push) {
			items = [ items ];
		}
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];

			if (item.effects) {
				item.effects.forEach(function (e) {
					if (e.factionId) {
						let faction = Factions.getById(e.factionId);
						let statGenerator = faction.uniqueStat;
						statGenerator.generate(item);
						return;
					}
					const effectModule = _.safeRequire(module, "../" + itemEffects.get(e.type));
					if (!effectModule) {
						_.log.inventory.error(`Effect not found: ${e.type}`);
						return;
					}
					e.events = effectModule.events;

					if (effectModule.events.onGetText) {
						e.text = effectModule.events.onGetText(item, e);
						return;
					}

					const { rolls } = e;
					if (!rolls.textTemplate) {
						return;
					}
					let text = rolls.textTemplate;
					while (text.includes("((")) { //FIXME - Will hang !!
						Object.entries(rolls).forEach(([k, v]) => {
							text = text.replaceAll(`((${k}))`, v);
						});

						if (rolls.applyEffect) {
							Object.entries(rolls.applyEffect).forEach(([k, v]) => {
								text = text.replaceAll(`((applyEffect.${k}))`, v);
							});
						}

						if (rolls.castSpell) {
							Object.entries(rolls.castSpell).forEach(([k, v]) => {
								text = text.replaceAll(`((castSpell.${k}))`, v);
							});
						}

						if (rolls.applyEffect?.scaleDamage) {
							Object.entries(rolls.applyEffect.scaleDamage).forEach(([k, v]) => {
								text = text.replaceAll(`((applyEffect.scaleDamage.${k}))`, v);
							});
						}

						if (rolls.castSpell?.scaleDamage) {
							Object.entries(rolls.castSpell.scaleDamage).forEach(([k, v]) => {
								text = text.replaceAll(`((castSpell.scaleDamage.${k}))`, v);
							});
						}
					}
					e.text = text;
				});
				item.effects.spliceWhere((e) => !e.events);
			}
			if (!item.has("pos") && !item.eq) {
				let pos = i;
				for (let j = 0; j < iLen; j++) {
					if (!items.some((fj) => (fj.pos === j))) {
						pos = j;
						break;
					}
				}
				item.pos = pos;
			} else if ((!item.eq) && (items.some((ii) => ((ii !== item) && (ii.pos === item.pos))))) {
				let pos = item.pos;
				for (let j = 0; j < iLen; j++) {
					if (!items.some((fi) => ((fi !== item) && (fi.pos === j)))) {
						pos = j;
						break;
					}
				}
				item.pos = pos;
			}
		}
	}

	, setItemPosition: function (id) {
		let item = this.findItem(id);
		if (!item) {
			return;
		}

		let iSize = this.inventorySize;
		for (let i = 0; i < iSize; i++) {
			if (!this.items.some((j) => (j.pos === i))) {
				item.pos = i;
				break;
			}
		}
	}

	, sortInventory: function () {
		this.items
			.filter((i) => !i.eq)
			.map((i) => {
				//If we don't do this, [waist] goes before [undefined]
				const useSlot = i.slot ? i.slot : "z";

				return {
					item: i
					, sortId: `${useSlot}${i.material}${i.quest}${i.spell}${i.quality}${i.level}${i.sprite}${i.id}`
				};
			})
			.sort((a, b) => {
				if (a.sortId < b.sortId) {
					return 1;
				} else if (a.sortId > b.sortId) {
					return -1;
				}
				return 0;
			})
			.forEach((i, index) => {
				i.item.pos = index;
				this.obj.syncer.setArray(true, "inventory", "getItems", this.simplifyItem(i.item));
			});
	}

	, resolveCallback: function (msg, result) {
		let callbackId = msg.has("callbackId") ? msg.callbackId : msg;
		result = result || [];

		if (!callbackId) {
			return;
		}

		process.send({
			module: "atlas"
			, method: "resolveCallback"
			, msg: {
				id: callbackId
				, result: result
			}
		});
	}

	, findItem: function (id) {
		if (id === null) {
			return null;
		}
		return this.items.find((i) => i.id === id);
	}

	, getDefaultAbilities: function () {
		let hasWeapon = this.items.some((i) => {
			return (
				i.spell &&
				i.spell.rolls &&
				i.spell.rolls.has("damage") &&
				(
					i.slot === "twoHanded" ||
					i.slot === "oneHanded"
				)
			);
		});

		if (!hasWeapon) {
			let item = generator.generate({
				type: classes.weapons[this.obj.class]
				, quality: 0
				, spellQuality: 0
			});
			item.worth = 0;
			item.eq = true;
			item.noSalvage = true;
			this.getItem(item);
		}

		classes.spells[this.obj.class].forEach((spellName) => {
			let hasSpell = this.items.some((i) => {
				return (
					i.spell &&
					i.spell.name.toLowerCase() === spellName
				);
			});

			if (!hasSpell) {
				let item = generator.generate({
					spell: true
					, quality: 0
					, spellName: spellName
				});
				item.worth = 0;
				item.eq = true;
				item.noSalvage = true;
				this.getItem(item);
			}
		});
	}

	, createBag: function (x, y, items, ownerName) {
		let topQuality = 0;
		for (const item of items) {
			let quality = Number.parseInt(item.quality);
			item.fromMob = Boolean(this.obj.mob);
			if (quality > topQuality) {
				topQuality = quality;
			}
		}
		// Map quality to sprite cell.
		let bagCell = SPRITE_CHEST_CELL_IDS[topQuality];
		if (!bagCell) {
			bagCell = SPRITE_CHEST_CELL_IDS[SPRITE_CHEST_CELL_IDS.length - 1];
		}
		const createBagMsg = {
			ownerName
			, x
			, y
			, sprite: {
				sheetName: "objects"
				, cell: bagCell
			}
			, dropSource: this.obj
		};
		this.obj.instance.eventEmitter.emit("onBeforeCreateBag", createBagMsg);

		const obj = this.obj.instance.objects.buildObjects([{
			sheetName: createBagMsg.sprite.sheetName
			, cell: createBagMsg.sprite.cell
			, x: createBagMsg.x
			, y: createBagMsg.y
			, properties: {
				cpnChest: {
					ownerName
					, ttl: 1710
				}
				, cpnInventory: {
					items: _.assign([], items)
				}
			}
		}]);
		obj.canBeSeenBy = ownerName;
		return obj;
	}

	, hasSpace: function (item, noStack) {
		const itemArray = item ? [item] : [];
		return this.hasSpaceList(itemArray, noStack);
	}

	, hasSpaceList: function (items, noStack) {
		if (this.inventorySize === -1) {
			return true;
		}

		let slots = this.inventorySize - this.obj.inventory.items.filter((f) => !f.eq).length;
		for (const item of items) {
			if (isItemStackable(item) && (!noStack)) {
				let exists = this.items.find((owned) => (owned.name === item.name) && (isItemStackable(owned)));
				if (exists) {
					continue;
				}
			}
			slots--;
		}

		return (slots >= 0);
	}

	, getItem: function (item, hideMessage, noStack, hideAlert, createBagIfFull) {
		return getItem.call(this, this, ...arguments);
	}

	, dropBag: function (ownerName, killSource) {
		dropBag(this, ownerName, killSource);
	}

	, giveItems: function (obj, hideMessage) {
		const objInventory = obj.inventory;
		const items = this.items;
		for (let i = items.length - 1; i >= 0; --i) {
			const item = items[i];
			if (objInventory.getItem(item, hideMessage)) {
				items.splice(i, 1);
			}
		}
		return (items.length <= 0);
	}

	, fireEvent: function (event, args) {
		let items = this.items;
		let iLen = items.length;
		for (let i = 0; i < iLen; i++) {
			let item = items[i];

			if (!item.eq && !item.active) {
				if (event !== "afterUnequipItem" || item !== args[0]) {
					continue;
				}
			}

			let effects = item.effects;
			if (!effects) {
				continue;
			}

			let eLen = effects.length;
			for (let j = 0; j < eLen; j++) {
				let effect = effects[j];

				let effectEvent = effect.events[event];
				if (!effectEvent) {
					continue;
				}

				effectEvent.apply(this.obj, [item, ...args]);
			}
		}
	}

	, clear: function () {
		delete this.items;
		this.items = [];
	}

	, equipItemErrors: function (item) {
		const { obj: { player, stats: { values: statValues }, reputation } } = this;

		const errors = [];

		if (!player) {
			return errors;
		}

		if (item.level > statValues.level) {
			errors.push("level");
		}

		if (item.requires && statValues[item.requires[0].stat] < item.requires[0].value) {
			errors.push(item.requires[0].stat);
		}

		if (item.factions?.some((f) => reputation.getTier(f.id) < f.tier)) {
			errors.push("faction");
		}

		return errors;
	}

	, canEquipItem: function (item) {
		return (this.equipItemErrors(item).length === 0);
	}

	, notifyNoBagSpace: function (message = "Your bags are too full to loot any more items") {
		this.obj.social.notifySelf({ message });
	}
};
