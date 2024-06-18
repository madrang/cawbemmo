const cloneRecursive = function (o, newO) {
	if (typeof o !== "object") {
		return o;
	}
	if (!o) {
		return o;
	}
	if (o instanceof Array) {
		if (!newO || !newO.push) {
			newO = [];
		}
		for (let i = 0; i < o.length; i++) {
			newO[i] = cloneRecursive(o[i], newO[i]);
		}
		return newO;
	}
	if (!newO) {
		newO = {};
	}
	for (let i in o) {
		if (o.hasOwnProperty(i)) {
			newO[i] = cloneRecursive(o[i], newO[i]);
		}
	}
	return newO;
};

const clone = function (o) {
	let aLen = arguments.length;
	for (let i = 1; i < aLen; i++) {
		cloneRecursive(arguments[i], o);
	}
	return o;
};

module.exports = clone;
