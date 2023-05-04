module.exports = {
	type: 'singleTargetHeal',

	cdMax: 20,
	manaCost: 0,
	range: 9,

	healing: 1,

	needLos: true,
	targetFriendly: true,

	spellType: 'heal',
	particleDuration: 10,

	cast: function (action) {
		const target = action.target;
		const { x, y } = target;

		const heal = this.getDamage(target, true);

		const event = {
			heal,
			source: this.obj,
			target,
			spellName: 'singleTargetHeal',
			spell: this,
			noEvents: this.noEvents
		};

		target.stats.getHp(event);

		const effect = {
			x,
			y,
			components: [{
				type: 'particles',
				//This ttl is in frames (each frame is roughly 1000 / 60 ms)
				ttl: (1000 / 60) * this.particleDuration,
				destroyObject: true,
				blueprint: this.particles
			}]
		};

		this.obj.instance.syncer.queue('onGetObject', effect, -1);

		this.sendBump(target);

		return true;
	}
};
