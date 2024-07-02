let cpnDeathStopper = {
	type: "deathStopper"
	, percentage: 0
	, end: false

	, events: {
		beforeTakeDamage: function ({ damage }) {
			let statValues = this.obj.stats.values;
			let minHp = statValues.hpMax * this.percentage;
			if (statValues.hp - damage.amount < minHp) {
				this.end = true;
				damage.amount = Math.max(0, statValues.hp - minHp);
			}
		}
	}
};

module.exports = {
	mobs: null

	, init: function () {
		if (!Array.isArray(this.mobs)) {
			this.mobs = [ this.mobs ];
		}
		let mobs = this.mobs;
		let percentage = this.percentage;

		const objects = this.instance.objects.objects;
		for (const o of objects) {
			const index = mobs.indexOf(o.id);
			if (index === -1) {
				continue;
			}
			if (percentage) {
				let cpn = _.assign({}, cpnDeathStopper, {
					percentage: percentage
				});
				o.components.push(cpn);
				cpn.obj = o;
			}
			mobs.splice(index, 1, o);
		}
	}

	, update: function () {
		let mobs = this.mobs;
		let mLen = mobs.length;
		for (let i = 0; i < mLen; i++) {
			let m = mobs[i];
			let destroyed = m.destroyed;
			if (!destroyed) {
				let deathStopper = m.components.find((c) => (c.type === "deathStopper"));
				if (deathStopper) {
					destroyed = deathStopper.end;
				}
			}
			// Remove destroyed mobs.
			if (destroyed) {
				mobs.splice(i, 1);
				mLen--;
				i--;
			}
		}
		// Is completed once all tracked mobs are killed.
		if (mobs.length === 0) {
			this.end = true;
		}
	}
};
