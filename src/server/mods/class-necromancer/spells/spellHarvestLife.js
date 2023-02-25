module.exports = {
	type: 'harvestLife',
	
	cdMax: 5,
	manaCost: 0,
	range: 1,

	damage: 1,

	col: 4,
	row: 1,

	init: function () {
		if (this.range > 1)
			this.needLos = true;
	},

	cast: function (action) {
		let target = action.target;

		let row = this.row;
		let col = this.col;

		this.sendAnimation({
			id: target.id,
			components: [{
				type: 'attackAnimation',
				new: true,
				row: row,
				col: col
			}]
		});

		this.sendBump(target);

		this.queueCallback(this.explode.bind(this, target), 100);

		return true;
	},
	explode: function (target) {
		let obj = this.obj;

		if ((obj.destroyed) || (target.destroyed))
			return;
		
		let damage = this.getDamage(target);
		target.stats.takeDamage({
			damage,
			threatMult: this.threatMult,
			source: obj,
			target,
			spellName: 'harvestLife'
		});

		let healAmount = damage.amount * (this.healPercent / 100);
		obj.stats.getHp({
			event: {
				amount: healAmount
			},
			source: obj,
			target: obj
		});
	}
};
