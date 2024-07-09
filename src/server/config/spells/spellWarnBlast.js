module.exports = {
	type: "warnBlast"

	, range: 100

	, castingEffect: null

	, statType: "dex"
	, statMult: 1
	, targetGround: true

	, needLos: true

	, damage: 10

	, delay: 10

	, radius: 1

	, row: null
	, col: 4
	, rowOptions: [10, 10, 10, 10, 10, 10, 10, 8, 8, 8, 7, 7, 7]
	, spriteSheet: "attacks"

	, cast: function (action) {
		let obj = this.obj;

		let physics = obj.instance.physics;

		let target = action.target;
		let x = target.x;
		let y = target.y;

		let radius = this.radius;

		let xMin = x - radius;
		let xMax = x + radius;

		let yMin = y - radius;
		let yMax = y + radius;

		let attackTemplate = this.attackTemplate;
		if (attackTemplate) {
			attackTemplate = attackTemplate.split(" ");
		}
		let count = -1;

		for (let i = xMin; i <= xMax; i++) {
			for (let j = yMin; j <= yMax; j++) {
				count++;
				if (!physics.hasLos(x, y, i, j)) {
					continue;
				} else if (attackTemplate && attackTemplate[count] === "x") {
					continue;
				}
				if (attackTemplate && Math.floor(attackTemplate[count]) > 0) {
					this.queueCallback(this.spawnWarning.bind(this, i, j), ~~attackTemplate[count] * consts.tickTime);
					continue;
				} else {
					this.spawnWarning(i, j);
				}
			}
		}
		this.sendBump(target);
		return true;
	}

	, spawnWarning: function (x, y) {
		const obj = this.obj;
		const syncer = obj.instance.syncer;
		const effect = {
			x: x
			, y: y
			, components: [{
				type: "particles"
				, noExplosion: true
				, ttl: this.delay * 175 / 16
				, blueprint: this.particles
			}]
		};
		syncer.queue("onGetObject", effect, -1);
		this.queueCallback(this.onWarningOver.bind(this, x, y), this.delay * consts.tickTime);
	}

	, onWarningOver: function (x, y) {
		const { obj, spriteSheet, rowOptions, col, row } = this;

		const physics = obj.instance.physics;
		const syncer = obj.instance.syncer;
		const useRow = (row !== null) ? row : rowOptions[Math.floor(Math.random() * rowOptions.length)];
		const effect = {
			x: x
			, y: y
			, components: [{
				type: "attackAnimation"
				, destroyObject: true
				, row: useRow
				, col
				, frameDelay: 4 + Math.floor(Math.random() * 7)
				, spriteSheet
			}]
		};
		syncer.queue("onGetObject", effect, -1);

		const mobs = physics.getCell(x, y);
		for (let k = mobs.length - 1; k >= 0; --k) {
			const m = mobs[k];
			// m can be undefined if mob was just killed.
			if (!m || !m.aggro || !this.obj.aggro.canAttack(m)) {
				continue;
			}
			m.stats.takeDamage({
				damage: this.getDamage(m)
				, threatMult: 1
				, source: obj
				, target: m
				, spellName: "warnBlast"
				, noEvents: this.noEvents
			});
		}
	}
};
