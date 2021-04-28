define([
	'js/objects/objBase',
	'js/system/events',
	'js/rendering/renderer',
	'js/sound/sound',
	'js/config'
], function (
	objBase,
	events,
	renderer,
	sound,
	config
) {
	return {
		objects: [],

		init: function () {
			events.on('onGetObject', this.onGetObject.bind(this));
			events.on('onRezone', this.onRezone.bind(this));
			events.on('onChangeHoverTile', this.getLocation.bind(this));
			events.on('onTilesVisible', this.onTilesVisible.bind(this));
			events.on('onToggleNameplates', this.onToggleNameplates.bind(this));
		},

		getLocation: function (x, y) {
			let objects = this.objects;
			let oLen = objects.length;

			let closest = 999;
			let mob = null;
			for (let i = 0; i < oLen; i++) {
				let o = objects[i];
				
				if (!o.stats || o.nonSelectable || o === window.player || !o.sprite || !o.sprite.visible)
					continue;

				let dx = Math.abs(o.x - x);
				if ((dx < 3) && (dx < closest)) {
					let dy = Math.abs(o.y - y);
					if ((dy < 3) && (dy < closest)) {
						mob = o;
						closest = Math.max(dx, dy);
					}
				}
			}

			events.emit('onMobHover', mob);
		},

		getClosest: function (x, y, maxDistance, reverse, fromMob) {
			let objects = this.objects;

			let list = objects.filter(function (o) {
				if ((!o.stats) || (o.nonSelectable) || (o === window.player) || (!o.sprite.visible))
					return false;

				let dx = Math.abs(o.x - x);
				if (dx < maxDistance) {
					let dy = Math.abs(o.y - y);
					if (dy < maxDistance)
						return true;
				}
			});

			if (list.length === 0)
				return null;

			list.sort(function (a, b) {
				let aDistance = Math.max(Math.abs(x - a.x), Math.abs(y - a.y));
				let bDistance = Math.max(Math.abs(x - b.x), Math.abs(y - b.y));

				return (aDistance - bDistance);
			});

			list = list.filter(o => ((o.aggro) && (o.aggro.faction !== window.player.aggro.faction)));

			if (!fromMob)
				return list[0];

			let fromIndex = list.findIndex(function (l) {
				return (l.id === fromMob.id);
			});

			if (reverse) 
				fromIndex = (fromIndex === 0 ? list.length : fromIndex) - 1;
			else 
				fromIndex = (fromIndex + 1) % list.length;

			return list[fromIndex];
		},

		onRezone: function (oldZone) {
			let objects = this.objects;
			let oLen = objects.length;
			for (let i = 0; i < oLen; i++) {
				let o = objects[i];

				if (oldZone === null)
					o.destroy();
				else if ((o.zoneId === oldZone) && (!o.has('player')))
					o.destroy();
			}

			if (window.player)
				window.player.offEvents();
		},

		onGetObject: function (obj) {
			//Things like attacks don't have ids
			let exists = null;
			if (obj.has('id')) 
				exists = this.objects.find(({ id, destroyed }) => id === obj.id && !destroyed);

			if (!exists)
				exists = this.buildObject(obj);
			else
				this.updateObject(exists, obj);
		},

		buildObject: function (template) {
			let obj = $.extend(true, {}, objBase);

			let components = template.components || [];
			delete template.components;

			let syncTypes = ['portrait', 'area'];

			for (let p in template) {
				let value = template[p];
				let type = typeof (value);

				if (type === 'object') {
					if (syncTypes.indexOf(p) > -1)
						obj[p] = value;
				} else
					obj[p] = value;
			}

			if (obj.sheetName)
				obj.sprite = renderer.buildObject(obj);

			if ((obj.name) && (obj.sprite)) {
				obj.nameSprite = renderer.buildText({
					layerName: 'effects',
					text: obj.name,
					x: (obj.x * scale) + (scale / 2),
					y: (obj.y * scale) + scale
				});
			}

			//We need to set visibility before components kick in as they sometimes need access to isVisible
			obj.updateVisibility();

			components.forEach(function (c) {
				//Map ids to objects
				let keys = Object.keys(c).filter(function (k) {
					return ((k.indexOf('id') === 0) && (k.length > 2));
				});
				keys.forEach(function (k) {
					let value = c[k];
					let newKey = k.substr(2, k.length).toLowerCase();

					c[newKey] = this.objects.find(function (o) {
						return (o.id === value);
					});
					delete c[k];
				}, this);

				obj.addComponent(c.type, c);
			}, this);

			if (obj.self) {
				events.emit('onGetPlayer', obj);
				window.player = obj;

				sound.unload(obj.zoneId);

				renderer.setPosition({
					x: (obj.x - (renderer.width / (scale * 2))) * scale,
					y: (obj.y - (renderer.height / (scale * 2))) * scale
				}, true);
			}

			this.objects.push(obj);

			return obj;
		},

		updateObject: function (obj, template) {
			let components = template.components || [];

			components.forEach(function (c) {
				//Map ids to objects
				let keys = Object.keys(c).filter(function (k) {
					return ((k.indexOf('id') === 0) && (k.length > 2));
				});
				keys.forEach(function (k) {
					let value = c[k];
					let newKey = k.substr(2, k.length).toLowerCase();

					c[newKey] = this.objects.find(function (o) {
						return (o.id === value);
					});
					delete c[k];
				}, this);

				obj.addComponent(c.type, c);
			}, this);

			delete template.components;

			if (template.removeComponents) {
				template.removeComponents.forEach(function (r) {
					obj.removeComponent(r);
				});
				delete template.removeComponents;
			}

			let oldX = obj.x;

			let sprite = obj.sprite;
			for (let p in template) {
				let value = template[p];
				let type = typeof (value);

				if (type !== 'object')
					obj[p] = value;

				if (p === 'casting') {
					if (obj === window.player)
						events.emit('onGetSelfCasting', value);
					else
						events.emit('onGetTargetCasting', obj.id, value);
				}

				if (sprite) {
					if (p === 'x') {
						if (obj.x < oldX)
							obj.flipX = true;
						else if (obj.x > oldX)
							obj.flipX = false;
					}
				}
			}

			if (((template.sheetName) || (template.cell)) && (sprite))
				renderer.setSprite(obj);

			if ((!obj.sprite) && (template.sheetName))
				obj.sprite = renderer.buildObject(obj);

			if ((!obj.nameSprite) && (template.name)) {
				obj.nameSprite = renderer.buildText({
					layerName: 'effects',
					text: template.name,
					x: (obj.x * scale) + (scale / 2),
					y: (obj.y * scale) + scale
				});
			}

			if ((template.x !== 0) || (template.y !== 0)) {
				obj.updateVisibility();
				obj.setSpritePosition();

				if (obj.stats)
					obj.stats.updateHpSprite();
			}
		},

		update: function () {
			let objects = this.objects;
			let len = objects.length;

			for (let i = 0; i < len; i++) {
				let o = objects[i];

				if (o.destroyed) {
					o.destroy();
					objects.splice(i, 1);
					i--;
					len--;
					continue;
				}

				o.update();
			}
		},

		onTilesVisible: function (tiles, visible) {
			let objects = this.objects;
			let oLen = objects.length;
			for (let i = 0; i < oLen; i++) {
				let o = objects[i];

				let onPos = tiles.some(function (t) {
					return (!(t.x !== o.x || t.y !== o.y));
				});
				if (!onPos)
					continue;

				o.setVisible(visible);
			}
		},

		onToggleNameplates: function (show) {
			let objects = this.objects;
			let oLen = objects.length;
			for (let i = 0; i < oLen; i++) {
				let obj = objects[i];
				let ns = obj.nameSprite;
				if ((!ns) || (obj.dead) || ((obj.sprite) && (!obj.sprite.visible)))
					continue;

				ns.visible = show;
			}
		}
	};
});
