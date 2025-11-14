let lastCallbackId = 0;
const callbacks = [];

const registerCallback = (callback) => {
	callbacks.push({
		id: ++lastCallbackId
		, callback
	});
	//_.log.atlas.trace("Message callback %s registered in atlas.", lastCallbackId);
	return lastCallbackId;
};

const removeCallback = (callbackId) => {
	return callbacks.spliceFirstWhere((c) => c.id === callbackId);
};

module.exports = {
	registerCallback
	, removeCallback
};
