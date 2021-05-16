define([
	'ui/templates/tooltipItem/onShowItemTooltip',
	'css!ui/templates/tooltipItem/styles',
	'html!ui/templates/tooltipItem/template'
], function (
	onShowItemTooltip,
	styles,
	template
) {
	return {
		tpl: template,
		type: 'tooltipItem',

		tooltip: null,
		item: null,

		postRender: function () {
			this.tooltip = this.el.find('.tooltip');

			this.onEvent('onShowItemTooltip', onShowItemTooltip.bind(null, this));
			this.onEvent('onHideItemTooltip', this.onHideItemTooltip.bind(this));
		},

		showWorth: function (canAfford) {
			this.tooltip.find('.worth').show();

			if (!canAfford)
				this.tooltip.find('.worth').addClass('no-afford');
		},

		onHideItemTooltip: function (item) {
			if (
				(!this.item) ||
				(
					(this.item !== item) &&
					(this.item.refItem) &&
					(this.item.refItem !== item)
				)
			)
				return;

			this.item = null;
			this.tooltip.hide();

			this.removeButton();
		},

		addButton: function (label, cb) {
			let tt = this.tooltip;
			let pos = tt.offset();
			let width = tt.outerWidth();
			let height = tt.outerHeight();

			$(`<div class='btn'>${label}</div>`)
				.appendTo(this.el)
				.on('click', cb)
				.css({
					width: width,
					left: pos.left,
					top: pos.top + height
				});
		},

		beforeHide: function () {
			this.removeButton();
		},

		removeButton: function () {
			this.find('.btn').remove();
		}
	};
});
