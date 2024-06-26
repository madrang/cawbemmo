module.exports = {
	type: "smite"

	, cdMax: 5
	, manaCost: 0
	, range: 1

	, damage: 1

	, col: 4
	, row: 1

	, init: function () {
		if (this.range > 1) {
			this.needLos = true;
		}
	}

	, cast: function (action) {
		let target = action.target;

		let row = this.row;
		let col = this.col;

		this.sendAnimation({
			id: target.id
			, components: [{
				type: "attackAnimation"
				, new: true
				, row: row
				, col: col
			}]
		});

		this.sendBump(target);

		this.queueCallback(this.explode.bind(this, target), 100);

		return true;
	}
	, explode: function (target) {
		if ((this.obj.destroyed) || (target.destroyed)) {
			return;
		}

		let damage = this.getDamage(target);
		target.stats.takeDamage({
			damage
			, threatMult: this.threatMult
			, source: this.obj
			, target
			, spellName: "smite"
			, noEvents: this.noEvents
		});

		target.effects.addEffect({
			type: "stunned"
			, ttl: this.stunDuration
		});
	}
};
