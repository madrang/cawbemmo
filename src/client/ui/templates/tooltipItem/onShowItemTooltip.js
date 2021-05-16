define([
	'js/input',
	'js/system/events',
	'js/misc/statTranslations',
	'ui/templates/tooltipItem/helpers',
	'ui/templates/tooltipItem/getCompareItem'
], function (
	input,
	events,
	statTranslations,
	helpers,
	getCompareItem,
	tplTooltip
) {
	const { init: initHelpers, helpers: g } = helpers;

	const buildTooltipHtml = ({ quality }) => {
		const html = [
			g.div(`name q${quality}`, [
				g.div('text', g.name()),
				g.div('type', g.type()),
				g.div('power', g.power())
			]),
			g.div('implicitStats', g.implicitStats()),
			g.div('stats', g.stats()),
			g.div('effects', g.effects()),
			g.div('material', g.material()),
			g.div('quest', g.quest()),
			g.spellName(),
			g.div('damage', g.damage()),
			g.requires('requires', [
				'requires',
				g.requireLevel('level'),
				g.requireStats('stats'),
				g.requireFaction('faction')
			]),
			g.div('worth', g.worth()),
			g.div('info', g.info())
		]
			.filter(t => t !== null)
			.join('');

		return html;
	};

	const onShowItemTooltip = (ui, item, pos, canCompare, bottomAlign) => {
		let shiftDown = input.isKeyDown('shift', true);
		const equipErrors = window.player.inventory.equipItemErrors(item);

		const msg = {
			item,
			compare: null
		};
		getCompareItem(msg);

		const useItem = item = msg.item;
		if (isMobile && useItem === ui.item)
			shiftDown = true;
		ui.item = useItem;

		const compare = canCompare ? msg.compare : null;

		ui.item = item;
		ui.removeButton();

		initHelpers(item, compare, shiftDown, equipErrors);

		const contents = buildTooltipHtml(item);

		const el = ui.tooltip;
		el.html(contents);
		el.show();

		if (pos) {
			if (bottomAlign)
				pos.y -= el.height();

			//correct tooltips that are appearing offscreen
			// arbitrary constant -30 is there to stop resize code
			// completely squishing the popup
			if ((pos.x + el.width()) > window.innerWidth)
				pos.x = window.innerWidth - el.width() - 30;

			if ((pos.y + el.height()) > window.innerHeight)
				pos.y = window.innerHeight - el.height() - 30;

			el.css({
				left: pos.x,
				top: pos.y
			});
		}

		events.emit('onBuiltItemTooltip', ui.tooltip);
	};

	return onShowItemTooltip;
});
