module.exports = {
	events: {}

	, on: function (eventName, callback) {
		if (typeof eventName !== "string") {
			throw new Error("eventName must be a string.");
		}
		if (typeof callback !== "function") {
			throw new Error("callback must be a function.");
		}
		const list = this.events[eventName] || (this.events[eventName] = []);
		list.push(callback);
		return callback;
	}

	, off: function (eventName, callback) {
		const list = this.events[eventName] || [];
		let lLen = list.length;
		for (let i = 0; i < lLen; i++) {
			const { callback: lCallback } = list[i];
			if (lCallback === callback) {
				list.splice(i, 1);
				i--;
				lLen--;
			}
		}
		if (lLen === 0) {
			delete this.events[eventName];
		}
	}

	, emit: function (eventName, ...args) {
		if (typeof eventName !== "string") {
			throw new Error("eventName must be a string.");
		}
		const list = this.events[eventName];
		if (!list) {
			return;
		}
		const promises = [];
		for (const callback of list) {
			const r = callback.apply(null, args);
			if (typeof r === "object" && r instanceof Promise) {
				promises.push(r);
			}
		}
		if (promises.length === 1) {
			return promises[0];
		}
		if (promises.length > 0) {
			return Promise.all(promises);
		}
	}
};
