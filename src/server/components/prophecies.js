module.exports = {
	type: "prophecies"
	, list: []

	, init: function (blueprint) {
		(blueprint.list || []).forEach(function (p) {
			let template = null;
			try {
				template = require("../config/prophecies/" + p);
			} catch (e) {
				_.log.prophecies.error(e);
			}
			if (!template) {
				return;
			} else if (this.list.some((l) => (l.type === p))) {
				return;
			}
			const prophecy = _.assign({}, template);
			prophecy.obj = this.obj;
			prophecy.init();
			this.list.push(prophecy);
		}, this);
		delete blueprint.list;
	}

	, hasProphecy: function (type) {
		return this.list.some((l) => (l.type === type));
	}

	, transfer: function () {
		let transferList = this.list;
		this.list = [];

		this.init({
			list: transferList
		});
	}

	, fireEvent: function (event, args) {
		for (let l of this.list) {
			if (!l.events) {
				continue;
			}
			const callback = l.events[event];
			if (!callback) {
				continue;
			}
			callback.apply(l, args);
		}
	}

	, simplify: function (self) {
		const e = {
			type: "prophecies"
		};
		if ((this.list.length > 0) && (this.list[0].simplify)) {
			e.list = this.list.map((p) => p.simplify());
		} else {
			e.list = this.list;
		}
		return e;
	}
};
