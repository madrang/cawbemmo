let lastCallbackId = 0;
const callbacks = [];

const registerCallback = callback => {
	callbacks.push({
		id: ++lastCallbackId,
		callback
	});

	return lastCallbackId;
};

const removeCallback = callbackId => {
	const callback = callbacks.spliceFirstWhere(c => c.id === callbackId);

	return callback;
};

module.exports = {
	registerCallback,
	removeCallback
};
