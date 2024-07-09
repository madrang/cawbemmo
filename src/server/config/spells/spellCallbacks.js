module.exports = {
	callbacks: []

	, speed: 100

	, init: function () {
		setInterval(this.update.bind(this), this.speed);
	}

	, register: function (sourceId, callback, time, destroyCallback) {
		let obj = {
			sourceId: sourceId
			, callback: callback
			, destroyCallback: destroyCallback
			, time: time
		};

		this.callbacks.push(obj);

		return obj;
	}
	, unregister: function (sourceId) {
		const callbacks = this.callbacks;
		for (let i = callbacks.length - 1; i >= 0; --i) {
			const c = callbacks[i];
			if (c.sourceId === sourceId) {
				if (c.destroyCallback) {
					c.destroyCallback();
				}
				callbacks.splice(i, 1);
			}
		}
	}

	, update: function () {
		const callbacks = this.callbacks;
		for (let i = callbacks.length - 1; i >= 0; --i) {
			const c = callbacks[i];
			if (!c) {
				// If a spellCallback kills a mob he'll unregister his callbacks
				continue;
			}
			if (c.time > 0) {
				c.time -= this.speed;
			}
			if (c.time <= 0) {
				if (c.callback) {
					c.callback();
				}
				if (c.destroyCallback) {
					c.destroyCallback();
				}
				callbacks.splice(i, 1);
			}
		}
	}
};
