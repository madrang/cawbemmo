import events from "/js/system/events.js";
import client from "/js/system/client.js";
import factory from "/ui/factory.js";
import renderItem from "/ui/shared/renderItem.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/trade/template.html", { raw: true });
//const tplItem = await _.loadHTML("/ui/templates/inventory/templateItem.html", { raw: true });

export default {
	tpl: template

	, centered: true

	, modal: true
	, hasClose: true

	, list: null
	, action: null

	, postRender: function () {
		this.onEvent("onGetTradeList", this.onGetTradeList.bind(this));
		this.onEvent("onCloseTrade", this.hide.bind(this));
	}

	, onGetTradeList: function (itemList, action) {
		itemList = itemList || this.itemList;
		action = action || this.action;

		this.itemList = itemList;
		this.action = action;

		this.find(".heading-text").html(action);

		let uiInventory = factory.getUi("inventory");
		let container = this.el.find(".grid").empty();
		let buyItems = itemList.items;

		buyItems.forEach((item) => {
			if ((item === this.hoverItem)) {
				this.onHover(null, item);
			}
		});

		const itemsHavePositions = action === "sell" || buyItems.find((b) => b.pos);

		let iLen = Math.max(buyItems.length, 50);
		for (let i = 0; i < iLen; i++) {
			let item = buyItems[i];

			if (itemsHavePositions) {
				item = buyItems.find((b) => b.pos === i);
			}
			if (!item) {
				renderItem(container, null).on("click", uiInventory.hideTooltip.bind(uiInventory));
				continue;
			}
			item = _.assign({}, item);
			let itemEl = renderItem(container, item);
			itemEl.data("item", item).find(".icon").addClass(item.type);
			if (isMobile) {
				itemEl.on("click", this.onHover.bind(this, itemEl, item, action));
			} else {
				itemEl
					.on("click", this.onClick.bind(this, itemEl, item, action))
					.on("mousemove", this.onHover.bind(this, itemEl, item, action))
					.on("mouseleave", uiInventory.hideTooltip.bind(uiInventory, itemEl, item));
			}
			if (action === "buy") {
				let noAfford = false;
				if (item.worth.currency) {
					let currencyItems = window.player.inventory.items.find((f) => f.name === item.worth.currency);
					noAfford = ((!currencyItems) || (currencyItems.quantity < item.worth.amount));
				} else {
					noAfford = (Math.floor(item.worth * this.itemList.markup) > window.player.trade.gold);
				}

				if (!noAfford && item.factions) {
					noAfford = item.factions.some((f) => f.tier > window.player.reputation.getTier(f.id));
				}

				if (noAfford) {
					$("<div class=\"no-afford\"></div>").appendTo(itemEl);
				}
			}
			if (item.worth.currency) {
				item.worthText = item.worth.amount + "x " + item.worth.currency;
			} else {
				item.worthText = Math.floor(itemList.markup * item.worth);
			}
		}
		this.center();
		this.show();
		events.emit("onShowOverlay", this.el);
	}

	, onClick: async function (el, item, action, e) {
		el.addClass("disabled");

		await client.componentProxy.player.performAction({
			cpn: "trade", method: "buySell"
			, data: {
				itemId: item.id
				, action: action
			}
		});
		events.emit("onBuySellItem", this.el);

		el.removeClass("disabled");

		const uiInventory = factory.getUi("inventory");
		uiInventory.hideTooltip(el, item, e);
	}

	, onHover: function (el, item, action, e) {
		const uiInventory = factory.getUi("inventory");
		uiInventory.onHover(el, item, e);

		let canAfford = true;
		if (action === "buy") {
			if (item.worth.currency) {
				let currencyItems = window.player.inventory.items.find((i) => i.name === item.worth.currency);
				canAfford = (currencyItems && currencyItems.quantity >= item.worth.amount);
			} else {
				canAfford = (item.worth * this.itemList.markup <= window.player.trade.gold);
			}
		}

		const uiTooltipItem = factory.getUi("tooltipItem");
		uiTooltipItem.showWorth(canAfford);

		if (isMobile) {
			uiTooltipItem.addButton(action, this.onClick.bind(this, el, item, action));
		}
	}

	, beforeHide: function () {
		events.emit("onHideOverlay", this.el);
		const uiInventory = factory.getUi("inventory");
		uiInventory.hideTooltip();
	}
};
