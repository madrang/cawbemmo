define([
	'js/rendering/renderer'
], function (
	renderer
) {
	let auras = {
		reflectDamage: 0,
		stealth: 1,
		regenHp: 9,
		regenMana: 10,
		swiftness: 11,
		holyVengeance: 8,
		rare: 16
	};

	return {
		type: 'effects',

		alpha: 0,
		alphaDir: 0.0025,

		alphaMax: 0.6,
		alphaMin: 0.35,

		alphaCutoff: 0.4,

		effects: [],

		init: function (blueprint) {
			this.effects = this.effects
				.filter(e => auras[e] !== null)
				.map(e => {
					return {
						name: e,
						sprite: renderer.buildObject({
							layerName: 'effects',
							sheetName: 'auras',
							x: this.obj.x,
							y: this.obj.y + 1,
							w: scale * 3,
							h: scale * 3,
							cell: auras[e]
						})
					};
				});
		},
		extend: function (blueprint) {
			if (blueprint.addEffects) {
				blueprint.addEffects = blueprint.addEffects
					.filter(e => {
						return (auras[e] !== null);
					})
					.map(e => {
						return {
							name: e,
							sprite: renderer.buildObject({
								layerName: 'effects',
								sheetName: 'auras',
								x: this.obj.x,
								y: this.obj.y + 1,
								w: scale * 3,
								h: scale * 3,
								cell: auras[e]
							})
						};
					});

				this.effects.push.apply(this.effects, blueprint.addEffects || []);
			}
			if (blueprint.removeEffects) {
				blueprint.removeEffects.forEach(r => {
					let effect = this.effects.find(e => e.name === r);

					if (!effect)
						return;

					renderer.destroyObject({
						layerName: 'effects',
						sprite: effect.sprite
					});

					this.effects.spliceFirstWhere(e => e.name === r);
				});
			}
		},

		update: function () {
			this.alpha += this.alphaDir;
			if ((this.alphaDir > 0) && (this.alpha >= this.alphaMax)) {
				this.alpha = this.alphaMax;
				this.alphaDir *= -1;
			} else if ((this.alphaDir < 0) && (this.alpha <= this.alphaMin)) {
				this.alpha = this.alphaMin;
				this.alphaDir *= -1;
			}

			let x = this.obj.x;
			let y = this.obj.y;

			let useAlpha = this.alpha;
			if (useAlpha < this.alphaCutoff)
				useAlpha = 0;
			else {
				useAlpha -= this.alphaCutoff;
				useAlpha /= (this.alphaMax - this.alphaCutoff);
			}

			this.effects.forEach(e => {
				renderer.setSpritePosition({
					x,
					y: y + 1,
					sprite: e.sprite
				});

				e.sprite.alpha = useAlpha;

				e.sprite.visible = this.obj.isVisible;
			});
		},

		setVisible: function (visible) {
			this.effects.forEach(e => {
				e.sprite.visible = visible;
			});
		},

		destroy: function () {
			this.effects.forEach(e => {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: e.sprite
				});
			});
		}
	};
});
