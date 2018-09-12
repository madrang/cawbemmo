define([
	'js/system/client',
	'js/rendering/renderer',
	'js/system/events',
	'js/input'
], function (
	client,
	renderer,
	events,
	input
) {
	let objects = null;
	require(['js/objects/objects'], function (o) {
		objects = o;
	});

	return {
		type: 'spellbook',

		hoverTarget: null,
		target: null,
		targetSprite: null,

		reticleState: 0,
		reticleCd: 0,
		reticleCdMax: 10,
		reticleSprite: null,

		init: function (blueprint) {
			this.targetSprite = renderer.buildObject({
				sheetName: 'ui',
				layerName: 'effects',
				cell: 0,
				visible: false
			});

			this.reticleSprite = renderer.buildObject({
				sheetName: 'ui',
				layerName: 'effects',
				cell: 8,
				visible: false
			});

			events.emit('onGetSpells', this.spells);

			this.reticleCd = this.reticleCdMax;

			this.obj.on('onDeath', this.onDeath.bind(this));
			this.obj.on('onMobHover', this.onMobHover.bind(this));
			this.obj.on('mouseDown', this.onMouseDown.bind(this));
			this.obj.on('onKeyDown', this.onKeyDown.bind(this));
		},

		extend: function (blueprint) {
			if (blueprint.removeSpells) {
				blueprint.removeSpells.forEach(r => this.spells.spliceWhere(s => s.id === r));
				events.emit('onGetSpells', this.spells);
			}

			if (blueprint.getSpells) {
				blueprint.getSpells.forEach(function (s) {
					let existIndex = this.spells.firstIndex(f => f.id === s.id);

					if (existIndex > -1) {
						this.spells.splice(existIndex, 1, s);
						return;
					}

					this.spells.push(s);
					this.spells.sort((a, b) => a.id - b.id);
				}, this);

				events.emit('onGetSpells', this.spells);
			}
		},

		getSpell: function (number) {
			let spellNumber = (number === ' ') ? 0 : number;
			let spell = this.spells.find(s => s.id === spellNumber);

			return spell;
		},

		onMobHover: function (target) {
			this.hoverTarget = target;
		},

		onMouseDown: function (e, target) {
			this.target = target || this.hoverTarget;

			if (this.target) {
				this.targetSprite.x = this.target.x * scale;
				this.targetSprite.y = this.target.y * scale;

				this.targetSprite.visible = true;
			} else {
				client.request({
					cpn: 'player',
					method: 'queueAction',
					data: {
						action: 'spell',
						priority: true,
						target: null
					}
				});

				this.targetSprite.visible = false;
			}

			events.emit('onSetTarget', this.target, e);
		},

		tabTarget: function () {
			let closest = objects.getClosest(window.player.x, window.player.y, 10, input.isKeyDown('shift'), this.target);

			this.target = closest;
			this.targetSprite.visible = !!this.target;

			events.emit('onSetTarget', this.target, null);
		},

		onKeyDown: function (key) {
			if (key === 'tab') {
				this.tabTarget();
				return;
			} else if (isNaN(key))
				return;

			let spell = this.getSpell(~~key);
			if (!spell)
				return;

			let isShiftDown = input.isKeyDown('shift');

			let oldTarget = null;
			if (isShiftDown) {
				oldTarget = this.target;
				this.target = this.obj;
			}

			if (!spell.aura && !spell.targetGround && !spell.autoTargetFollower && !this.target)
				return;

			let hoverTile = this.obj.mouseMover.hoverTile;
			let target = hoverTile;
			if (spell.autoTargetFollower && !this.target)
				target = null;
			else if (!spell.targetGround && this.target)
				target = this.target.id;

			if (isShiftDown)
				this.target = oldTarget;

			if (target === this.obj && spell.noTargetSelf)
				return;

			client.request({
				cpn: 'player',
				method: 'queueAction',
				data: {
					action: 'spell',
					priority: true,
					spell: spell.id,
					auto: spell.auto,
					target: target,
					self: isShiftDown
				}
			});
		},

		onDeath: function () {
			this.target = null;
			this.targetSprite.visible = false;
		},

		update: function () {
			if (this.reticleCd > 0)
				this.reticleCd--;
			else {
				this.reticleCd = this.reticleCdMax;
				this.reticleState++;
				if (this.reticleState === 4)
					this.reticleState = 0;
			}

			let target = this.target;
			if (!target)
				return;

			if (this.target.destroyed || this.target.nonSelectable) {
				this.target = null;
				this.targetSprite.visible = false;
			}

			this.targetSprite.x = target.x * scale;
			this.targetSprite.y = target.y * scale;

			renderer.setSprite({
				sprite: this.targetSprite,
				cell: this.reticleState,
				sheetName: 'ui'
			});
		},

		destroy: function () {
			if (this.targetSprite) {
				renderer.destroyObject({
					layerName: 'effects',
					sprite: this.targetSprite
				});
			}
		}
	};
});
