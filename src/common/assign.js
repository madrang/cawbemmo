/** assign.js - A recursive implementation of Object.assign()
 */
(function() {

	const assignRecursive = function (newObj, objSrc, remapCallback, path) {
		if (!objSrc || typeof objSrc !== "object") {
			return objSrc;
		}
		if (Array.isArray(objSrc)) {
			if (!newObj || !newObj.push) {
				newObj = [];
			}
			for (let i = 0; i < objSrc.length; i++) {
				if (!remapCallback) {
					newObj[i] = assignRecursive(newObj[i], objSrc[i]);
					continue;
				}
				const result = remapCallback(newObj, objSrc[i], path, i);
				if (result?.has("index") && result.index < 0) {
					result.index = newObj.length;
				}
				newObj[result?.index || i] = result?.value || assignRecursive(newObj[result?.index || i], objSrc[i], remapCallback, `${path}[${i}]`);
			}
			return newObj;
		}
		if (!newObj) {
			newObj = {};
		}
		for (const propName in objSrc) {
			if (!objSrc.hasOwnProperty(propName)) {
				continue;
			}
			if (!remapCallback) {
				newObj[propName] = assignRecursive(newObj[propName], objSrc[propName]);
				continue;
			}
			const result = remapCallback(newObj, objSrc[propName], path, propName);
			newObj[result?.index || propName] = result?.value || assignRecursive(newObj[result?.index || propName], objSrc[propName], remapCallback, `${path}.${propName}`);
		}
		return newObj;
	};

	const REMAPPERS = {
		particles: function(target, value, path, property) {
			if (Array.isArray(target) && path.endsWith("behaviors") && value.has("type")) {
				// Replace index using matching type entry.
				return { index: target.findIndex((v) => v.type === value.type) };
			}
			if (property === "list" && Array.isArray(value) && value[0].has("time")) {
				// Replace all values using a copy of the current array.
				return { value: assignRecursive([], value) };
			}
		}
	};

	const tmpModule = {
		/** Recursively assign all sources properties to the target object.
		 * @param {*} target object
		 * @param  {...any} srcArgs source objects
		 * @returns target
		 */
		assign: function (target, ...srcArgs) {
			for (const srcA of srcArgs) {
				assignRecursive(target, srcA);
			}
			return target;
		}

		, assignWith: function (remapCallback, target, ...srcArgs) {
			if (typeof remapCallback === "string") {
				remapCallback = REMAPPERS[remapCallback];
			}
			for (const srcA of srcArgs) {
				assignRecursive(target, srcA, remapCallback);
			}
			return target;
		}
	};

	if (typeof define === "function" && define.amd) {
		define([], tmpModule);
	} else if (typeof module === "object" && module.exports) {
		module.exports = tmpModule;
	} else {
		throw new Error("Can't load assign.js in current env.");
	}
})();
