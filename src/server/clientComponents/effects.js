define([
	'js/rendering/renderer'
], function (
	renderer
) {
	return {
		type: 'effects',

		effects: [],

		templates: {
			
		},

		init: function (blueprint) {
			this.effects = this.effects.map(e => this.buildEffect(e));
		},

		buildEffect: function (data) {
			if (typeof data === 'string')
				data = { type: data };
			
			let template = this.templates[data.type] || {};

			let effect = $.extend(true, {}, template, data);

			effect.obj = this.obj;

			if (effect.init)
				effect.init();
			
			return effect;
		},

		extend: function (blueprint) {
			if (blueprint.addEffects) {
				blueprint.addEffects = blueprint.addEffects.map(e => this.buildEffect(e));

				this.effects.push.apply(this.effects, blueprint.addEffects || []);
			}
			if (blueprint.removeEffects) {
				blueprint.removeEffects.forEach(r => {
					let effect = this.effects.find(e => e.type === r);

					if (!effect)
						return;

					if (effect.destroy)
						effect.destroy();

					this.effects.spliceFirstWhere(e => e.type === r);
				});
			}
		},

		update: function () {
			this.effects.forEach(e => {
				if (e.update)
					e.update();
			});
		},

		setVisible: function (visible) {
			this.effects.forEach(e => {
				if (e.setVisible)
					e.setVisible(visible);
			});
		},

		destroy: function () {
			this.effects.forEach(e => {
				if (e.destroy)
					e.destroy();
			});
		}
	};
});
