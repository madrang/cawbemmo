define([
	'js/system/events',
	'js/objects/objects',
	'js/rendering/renderer',
	'js/config'
], function (
	events,
	objects,
	renderer,
	config
) {
	const elementColors = {
		arcane: 0xFC66F7,
		frost: 0x48EDFF,
		fire: 0xFF4252,
		holy: 0xFFEB38,
		poison: 0x51FC9A
	};

	return {
		list: [],

		init: function () {
			events.on('onGetDamage', this.onGetDamage.bind(this));
		},

		onGetDamage: function (msg) {
			if (config.damageNumbers === 'off')
				return;

			let target = objects.objects.find(function (o) {
				return (o.id === msg.id);
			});
			if (!target)
				return;

			let ttl = 35;

			let numberObj = {
				obj: target,
				amount: msg.amount,
				x: (target.x * scale),
				y: (target.y * scale) + scale - (scale / 4),
				ttl: ttl,
				ttlMax: ttl,
				event: msg.event,
				text: msg.text,
				crit: msg.crit,
				heal: msg.heal,
				element: msg.element
			};

			if (numberObj.event) 
				numberObj.y += (scale / 2);
			else if (numberObj.heal)
				numberObj.x -= scale;
			else
				numberObj.x += scale;

			let text = numberObj.text;
			if (!numberObj.event) {
				let amount = numberObj.amount;
				let div = ((~~(amount * 10) / 10) > 0) ? 10 : 100;
				text = (numberObj.heal ? '+' : '') + (~~(amount * div) / div);
			}

			let damageColor = 0xF2F5F5;
			if (config.damageNumbers === 'element')
				damageColor = elementColors[numberObj.element];
				
			numberObj.sprite = renderer.buildText({
				fontSize: numberObj.crit ? 22 : 18,
				layerName: 'effects',
				x: numberObj.x,
				y: numberObj.y,
				text: text,
				color: damageColor
			});

			this.list.push(numberObj);
		},

		update: function () {
			let list = this.list;
			let lLen = list.length;

			for (let i = 0; i < lLen; i++) {
				let l = list[i];
				l.ttl--;

				if (l.ttl === 0) {
					renderer.destroyObject({
						layerName: 'effects',
						sprite: l.sprite
					});
					list.splice(i, 1);
					i--;
					lLen--;
					continue;
				}

				if (l.event)
					l.y += 1;
				else
					l.y -= 1;

				let alpha = l.ttl / l.ttlMax;

				l.sprite.x = ~~(l.x / scaleMult) * scaleMult;
				l.sprite.y = ~~(l.y / scaleMult) * scaleMult;
				l.sprite.alpha = alpha;
			}
		}
	};
});
