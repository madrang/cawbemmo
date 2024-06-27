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
				let result = remapCallback(newObj, objSrc[i], path, i);
				const iPath = (path ? `${path}[${i}]` : `[${i}]`);
				if (typeof result !== "object") {
					if (result) {
						_.log.assignRecursive.error("Invalid remapCallback results '%s'.", result);
					}
					newObj[i] = assignRecursive(newObj[i], objSrc[i], remapCallback, iPath);
					continue;
				}
				if (!result.has("index")) {
					result.index = i;
				} else if (result.index < 0) {
					result.index = newObj.length;
				}
				if (result.hasOwnProperty("value")) {
					newObj[result.index] = assignRecursive(undefined, result.value);
				} else {
					newObj[result.index] = assignRecursive(newObj[result.index], objSrc[i], remapCallback, iPath);
				}
			}
			return newObj;
		}
		if (!newObj) {
			newObj = {};
		}
		/* Debug for particles
		if (!remapCallback
			&& newObj.has("behaviors") && Array.isArray(newObj.behaviors) && newObj.behaviors.length > 0
			&& objSrc.has("behaviors") && Array.isArray(objSrc.behaviors) && objSrc.behaviors.length > 0
		) {
			throw new Error(`Maybe use assignWith("particles") ??`);
		}
		*/
		for (const propName in objSrc) {
			if (!objSrc.hasOwnProperty(propName)) {
				continue;
			}
			if (!remapCallback) {
				newObj[propName] = assignRecursive(newObj[propName], objSrc[propName]);
				continue;
			}
			let result = remapCallback(newObj, objSrc[propName], path, propName);
			const nPath = (path ? `${path}.${propName}` : propName);
			if (typeof result !== "object") {
				if (result) {
					_.log.assignRecursive.error("Invalid remapCallback results '%s'.", result);
				}
				newObj[propName] = assignRecursive(newObj[propName], objSrc[propName], remapCallback, nPath);
				continue;
			}
			if (!result.has("index")) {
				result.index = propName;
			}
			if (result.hasOwnProperty("value")) {
				newObj[result.index] = assignRecursive(undefined, result.value);
			} else {
				newObj[result.index] = assignRecursive(newObj[result.index], objSrc[propName], remapCallback, nPath);
			}
		}
		return newObj;
	};

	const REMAPPERS = {
		particles: function(target, value, path, property) {
			if (Array.isArray(target) && path.endsWith("behaviors") && value.has("type")) {
				const result = {
					// Replace index using matching type entry.
					index: target.findIndex((v) => v.type === value.type)
				};
				if (value.type === "spawnShape") {
					// Replace old spawnShape with new one instead of merging.
					result.value = value;
				}
				return result;
			}
			if (property === "list" && Array.isArray(value) && value[0].has("time")) {
				// Replace all values using a copy of the current array.
				return { value };
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
