/** assign.js - A recursive implementation of Object.assign()
 */
(function() {
	const assignRecursive = function (objSrc, newObj) {
		if (typeof objSrc !== "object") {
			return objSrc;
		}
		if (!objSrc) {
			return objSrc;
		}
		if (Array.isArray(objSrc)) {
			if (!newObj || !newObj.push) {
				newObj = [];
			}
			for (let i = 0; i < objSrc.length; i++) {
				newObj[i] = assignRecursive(objSrc[i], newObj[i]);
			}
			return newObj;
		}
		if (!newObj) {
			newObj = {};
		}
		for (const propName in objSrc) {
			if (objSrc.hasOwnProperty(propName)) {
				newObj[propName] = assignRecursive(objSrc[propName], newObj[propName]);
			}
		}
		return newObj;
	};

	/** Recursively assign all sources properties to the target object.
	 * @param {*} target object
	 * @param  {...any} srcArgs source objects
	 * @returns target
	 */
	const assign = function (target, ...srcArgs) {
		for (const srcA of srcArgs) {
			assignRecursive(srcA, target);
		}
		return target;
	};

	if (typeof define === "function") {
		define([], assign);
	} else {
		module.exports = assign;
	}
})();
