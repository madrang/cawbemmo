module.exports = {
	events: {}

	//The only supported option right now is isAsync: boolean
	, on: function (event, callback, options) {
		let list = this.events[event] || (this.events[event] = []);
		list.push({ callback, ...options });

		return callback;
	}

	, off: function (event, callback) {
		let list = this.events[event] || [];
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
			delete this.events[event];
		}
	}

	, emit: async function (event) {
		const args = Array.prototype.slice.call(arguments, 1);
		const list = this.events[event];
		if (!list) {
			return;
		}
		for (const { isAsync, callback } of list) {
			if (isAsync) {
				await callback.apply(null, args);
			} else {
				callback.apply(null, args);
			}
		}
	}
};
