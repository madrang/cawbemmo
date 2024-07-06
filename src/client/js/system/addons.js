window.addons = {
	addons: []
	, events: null

	, register: function (addon) {
		this.addons.push(addon);
		if (this.events) {
			addon.init(this.events);
		}
	}

	, init: function (events) {
		this.events = events;
		for (const a of this.addons) {
			a.init(this.events);
		}
	}
};
