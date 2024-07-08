module.exports = {
	mobs: null

	, init: function () {
		if (!this.mobs.push) {
			this.mobs = [ this.mobs ];
		}

		let mobs = this.mobs;

		let objects = this.instance.objects.objects;
		let oLen = objects.length;
		for (let i = 0; i < oLen; i++) {
			let o = objects[i];
			let index = mobs.indexOf(o.id);
			if (index === -1) {
				continue;
			}

			mobs.splice(index, 1, o);
		}
	}

	, update: function () {
		const players = this.instance.objects.objects.filter((o) => o.player);
		const mobs = this.mobs;
		const distance = this.distance;
		for (let i = mobs.length - 1; i >= 0; --i) {
			const m = mobs[i];
			for (let j = players.length - 1; j >= 0; --j) {
				const p = players[j];
				if (Math.abs(p.x - m.x) <= distance
					&& Math.abs(p.y - m.y) <= distance
				) {
					mobs.splice(i, 1);
					break;
				}
			}
		}
		if (mobs.length <= 0) {
			this.end = true;
		}
	}
};
