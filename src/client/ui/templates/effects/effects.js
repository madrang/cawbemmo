define([
	"html!ui/templates/effects/template"
	, "css!ui/templates/effects/styles"
	, "html!ui/templates/effects/templateEffect"
], function (
	template,
	styles,
	templateEffect
) {
	return {
		tpl: template

		, icons: {}

		, postRender: function () {
			this.onEvent("onGetEffectIcon", this.onGetEffectIcon.bind(this));
			this.onEvent("onRemoveEffectIcon", this.onRemoveEffectIcon.bind(this));
		}

		, buildIcon: function (config) {
			let { icon, url } = config;
			if (!url) {
				url = "../../../images/statusIcons.png";
			}
			const imgX = icon[0] * -32;
			const imgY = icon[1] * -32;
			const el = $(templateEffect).appendTo(this.el)
				.find(".inner")
				.css({
					background: `url(${url}) ${imgX}px ${imgY}px`
				});
			return el.parent();
		}

		, onGetEffectIcon: function (config) {
			this.icons[config.id] = this.buildIcon(config);
		}

		, onRemoveEffectIcon: function (config) {
			const el = this.icons[config.id];
			if (!el) {
				return;
			}
			el.remove();
			delete this.icons[config.id];
		}
	};
});
