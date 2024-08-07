const coordinateDeltas = [
	[[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]
	, [[0, -2], [0, -1], [1, -2], [2, -2], [1, -1], [2, -1], [2, 0], [1, 0], [2, 1], [2, 2], [1, 1], [1, 2], [0, 2], [0, 1], [-1, 2], [-2, 2], [-2, 1], [-1, 1], [-2, 0], [-1, 0], [-2, -1], [-2, -2], [-1, -1], [-1, -2]]
];

const applyDamage = (target, damage, threatMult, source) => {
	target.stats.takeDamage({
		damage
		, threatMult
		, source
		, target
		, spellName: "whirlwind"
	});
};

const dealDamage = (spell, obj, coords) => {
	const { delay } = spell;
	const physics = obj.instance.physics;
	for (let i = coords.length - 1; i >= 0; --i) {
		const [ x, y ] = coords[i];
		const cellDelay = i * delay;
		const mobs = physics.getCell(x, y);
		for (let k = mobs.length - 1; k >= 0; --k) {
			const m = mobs[k];
			if (!m || !m.aggro || !m.effects || !obj.aggro.canAttack(m)) {
				continue;
			}
			const damage = spell.getDamage(m);
			spell.queueCallback(applyDamage.bind(null, m, damage, 1, obj), cellDelay);
		}
	}
};

module.exports = {
	type: "whirlwind"

	, cdMax: 5
	, manaCost: 10
	, range: 1
	//The delay is sent to the client and is how long (in ms) each tick takes to display
	, delay: 32

	, row: 5
	, col: 0
	, frames: 3
	, spriteSheet: "attacks"

	, damage: 1
	, isAttack: true

	, targetGround: true
	, targetPlayerPos: true

	, cast: function (action) {
		const { frames, row, col, delay, obj, spriteSheet } = this;
		const { id, instance, x: playerX, y: playerY } = obj;

		const coordinates = coordinateDeltas[this.range - 1].map(([x, y]) => [x + playerX, y + playerY]);

		const blueprint = {
			caster: id
			, components: [{
				idSource: id
				, type: "whirlwind"
				, coordinates
				, frames
				, row
				, col
				, delay
				, spriteSheet
			}]
		};

		this.sendBump({
			x: playerX
			, y: playerY - 1
		});

		obj.fireEvent("beforeSpawnWhirlwind", blueprint);

		instance.syncer.queue("onGetObject", blueprint, -1);

		dealDamage(this, obj, coordinates);

		return true;
	}
};
