define([

], function (

) {
	return {
		type: 'effects',

		effects: [],

		effectBase: {

		},

		templates: {
			
		},

		init: function (blueprint) {
			this.effects = this.effects.map(e => this.buildEffect(e));
		},

		buildEffect: function (data) {
			if (typeof data === 'string') {
				//TODO: temporary while we work on effects
				console.error('String type effects should be deprecated, this effect will be missing an id');
				data = { type: data };
			}
			
			let template = this.templates[data.type] || {};

			let effect = $.extend(true, {}, this.effectBase, template, data);

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
				blueprint.removeEffects.forEach(removeId => {
					let effect = this.effects.find(e => e.id === removeId);

					if (!effect)
						return;

					if (effect.destroy)
						effect.destroy();

					this.effects.spliceFirstWhere(e => e.id === removeId);
				});
			}
			if (blueprint.extendEffects) {
				blueprint.extendEffects.forEach(u => {
					let effect = this.effects.find(e => e.id === u.id);

					if (!effect)
						return;

					if (effect.extend)
						effect.extend(u.data);
					else {
						for (let p in u.data) 
							effect[p] = u.data[p];
					}
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
