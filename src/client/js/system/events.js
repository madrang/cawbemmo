define([

], function (

) {
	const eventsModule = {
		events: {}
		// Keep a map of the latest missed event.
		// Duplicate events will replace older ones to avoid growing the buffer forever.
		, queue: new Map()
		, on: function (eventName, callback) {
			if (typeof eventName !== "string") {
				throw new Error("eventName must be a string.");
			}
			if (typeof callback !== "function") {
				throw new Error("callback must be a function.");
			}
			const list = this.events[eventName] || (this.events[eventName] = []);
			list.push(callback);

			const args = this.queue.get(eventName);
			if (args) {
				callback.apply(null, args);
			}
			return callback;
		}
		, clearQueue: function () {
			this.queue.clear();
		}
		, off: function (eventName, callback) {
			const list = this.events[eventName];
			if (!list) {
				return;
			}
			for (let i = list.length - 1; i >= 0; --i) {
				if (list[i] === callback) {
					list.splice(i, 1);
				}
			}
			if (list.length <= 0) {
				delete this.events[eventName];
			}
		}
		, emit: function (eventName, ...args) {
			if (typeof eventName !== "string") {
				throw new Error("eventName must be a string.");
			}
			const list = this.events[eventName];
			if (!list) {
				this.queue.set(eventName, args);
				return;
			}
			for (const l of list) {
				l.apply(null, args);
			}
		}
	};
	if (window.addons) {
		window.addons.init(eventsModule);
	}
	return eventsModule;
});
