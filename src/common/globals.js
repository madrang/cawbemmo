/** globals.js - Export global vars to both client and server.
 */
(function() {
	//eslint-disable-next-line no-extend-native
	Object.defineProperties(Array.prototype, {
		"spliceWhere": {
			enumerable: false
			, value: function (callback, thisArg) {
				const arrObj = Object(this);
				let len = arrObj.length || 0;
				for (let idx = 0; idx < len; ++idx) {
					if (!(idx in arrObj)) {
						continue;
					}
					if (!callback.call(thisArg, arrObj[idx], idx, arrObj)) {
						continue;
					}
					arrObj.splice(idx, 1);
					idx--;
					len--;
				}
			}
		}
		, "spliceFirstWhere": {
			enumerable: false
			, value: function (callback, thisArg) {
				const arrObj = Object(this);
				let len = arrObj.length || 0;
				for (let idx = 0; idx < len; ++idx) {
					if (!(idx in arrObj)) {
						continue;
					}
					const kValue = arrObj[idx];
					if (!callback.call(thisArg, kValue, idx, arrObj)) {
						continue;
					}
					arrObj.splice(idx, 1);
					return kValue;
				}
			}
		}
	});

	//eslint-disable-next-line no-extend-native
	Object.defineProperty(Object.prototype, "has", {
		enumerable: false
		, value: function (prop) {
			return (this.hasOwnProperty(prop) && this[prop] !== undefined && this[prop] !== null);
		}
	});

	if (!String.prototype.padStart) {
		//eslint-disable-next-line no-extend-native
		String.prototype.padStart = function padStart (targetLength, padString) {
			targetLength = targetLength >> 0;
			padString = String(typeof padString !== "undefined" ? padString : " ");
			if (this.length >= targetLength) {
				return String(this);
			}
			targetLength = targetLength - this.length;
			if (targetLength > padString.length) {
				padString += padString.repeat(targetLength / padString.length);
			}
			return padString.slice(0, targetLength) + String(this);
		};
	}
	Object.defineProperties(String.prototype, {
		indexOfAny: {
			enumerable: false
			, value: function (charsArr) {
				const sLen = this.length;
				for (let i = 0; i < sLen; ++i) {
					if (charsArr.includes(this[i])) {
						return i;
					}
				}
				return -1;
			}
		}
		, isAlphanumeric: {
			enumerable: false
			, value: function () {
				return /^[0-9a-zA-Z]+$/.test(this);
			}
		}
	});

	const assignRecursive = function (objSrc, newObj, remapCallback, path) {
		if (!objSrc || typeof objSrc !== "object") {
			return objSrc;
		}
		if (Array.isArray(objSrc)) {
			if (!newObj || !newObj.push) {
				newObj = [];
			}
			for (let i = 0; i < objSrc.length; i++) {
				if (!remapCallback) {
					newObj[i] = assignRecursive(objSrc[i], newObj[i]);
					continue;
				}
				const result = remapCallback(newObj, objSrc[i], path, i);
				if (result?.has("index") && result.index < 0) {
					result.index = newObj.length;
				}
				newObj[result?.index || i] = result?.value || assignRecursive(objSrc[i], newObj[result?.index || i], remapCallback, `${path}[${i}]`);
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
				newObj[propName] = assignRecursive(objSrc[propName], newObj[propName]);
				continue;
			}
			const result = remapCallback(newObj, objSrc[propName], path, propName);
			newObj[result?.index || propName] = result?.value || assignRecursive(objSrc[propName], newObj[result?.index || propName], remapCallback, `${path}.${propName}`);
		}
		return newObj;
	};

	const REMAPPERS = {
		particles: function(target, value, path, property) {
			if (Array.isArray(target) && path.endsWith("behaviors") && value.has("type")) {
				return {
					index: target.findIndex((v) => v.type === value.type)
				};
			}
			if (property === "list" && Array.isArray(value) && value[0].has("time")) {
				return { value };
			}
		}
	};

	const tmpExport = {
		CONSTANTS: (params, obj, enumerable = true) => {
			const properties = {};
			if (typeof params === "object") {
				params = [].concat(
					Object.getOwnPropertySymbols(params).map(s => [s, params[s]])
					, Object.entries(params)
				);
			}
			if (Array.isArray(params)) {
				params.forEach(([key, val]) => properties[key] = { value: val, writable: false, configurable: true, enumerable });
			} else {
				throw new Error("Invalid params type");
			}
			return Object.defineProperties(obj || window || global, properties);
		}

		/** Pause the execution of an async function until timer elapse.
		 * @Returns a promise that will resolve after the specified timeout.
		 */
		, asyncDelay: function (timeout) {
			return new Promise(function(resolve, reject) {
				setTimeout(resolve, timeout, true)
			})
		}

		, makeQuerablePromise: function (promise) {
			if (typeof promise !== 'object') {
				throw new Error('promise is not an object.')
			}
			if (!(promise instanceof Promise)) {
				throw new Error('Argument is not a promise.')
			}
			// Don't modify a promise that's been already modified.
			if ('isResolved' in promise || 'isRejected' in promise || 'isPending' in promise) {
				return promise
			}
			let isPending = true
			let isRejected = false
			let rejectReason = undefined
			let isResolved = false
			let resolvedValue = undefined
			const qurPro = promise.then(
				function(val){
					isResolved = true
					isPending = false
					resolvedValue = val
					return val
				}
				, function(reason) {
					rejectReason = reason
					isRejected = true
					isPending = false
					throw reason
				}
			)
			Object.defineProperties(qurPro, {
				'isResolved': {
					get: () => isResolved
				}
				, 'resolvedValue': {
					get: () => resolvedValue
				}
				, 'isPending': {
					get: () => isPending
				}
				, 'isRejected': {
					get: () => isRejected
				}
				, 'rejectReason': {
					get: () => rejectReason
				}
			})
			return qurPro
		}

		, PromiseSource: function () {
			const srcPromise = new Promise((resolve, reject) => {
				Object.defineProperties(this, {
					resolve: { value: resolve, writable: false }
					, reject: { value: reject, writable: false }
				})
			})
			Object.defineProperties(this, {
				promise: {value: makeQuerablePromise(srcPromise), writable: false}
			})
		}

		/** A debounce is a higher-order function, which is a function that returns another function
		* that, as long as it continues to be invoked, will not be triggered.
		* The function will be called after it stops being called for N milliseconds.
		* If `immediate` is passed, trigger the function on the leading edge, instead of the trailing.
		* @Returns a promise that will resolve to func return value.
		*/
		, debounce: function(func, wait, immediate, allowRepeat) {
			if (typeof wait === "undefined") {
				wait = 40
			}
			if (typeof wait !== "number") {
				throw new Error("wait is not an number.")
			}
			let timeout = null
			let lastPromiseSrc = new PromiseSource()
			const applyFn = function(context, args) {
				if (!lastPromiseSrc) {
					return
				}
				let result = undefined
				try {
					result = func.apply(context, args)
				} catch (err) {
					lastPromiseSrc.reject(err)
					lastPromiseSrc = null
					return
				}
				if (result instanceof Promise) {
					result.then(lastPromiseSrc.resolve, lastPromiseSrc.reject)
				} else {
					lastPromiseSrc.resolve(result)
				}
				lastPromiseSrc = null
			}
			return function(...args) {
				const callNow = Boolean(immediate && !timeout)
				const context = this;
				if (!lastPromiseSrc) {
					lastPromiseSrc = new PromiseSource()
				}
				const currentPromiseSrc = lastPromiseSrc
				if (timeout) {
					if (allowRepeat) {
						return
					}
					clearTimeout(timeout)
				}
				timeout = setTimeout(function () {
					if (!immediate) {
						applyFn(context, args)
					}
					timeout = null
				}, wait)
				if (callNow) {
					applyFn(context, args)
				}
				return currentPromiseSrc.promise
			}
		}

		/** Recursively assign all sources properties to the target object.
		 * @param {*} target object
		 * @param  {...any} srcArgs source objects
		 * @returns target
		 */
		, assign: function (target, ...srcArgs) {
			for (const srcA of srcArgs) {
				assignRecursive(srcA, target);
			}
			return target;
		}

		, assignWith: function (remapCallback, target, ...srcArgs) {
			if (typeof remapCallback === "string") {
				remapCallback = REMAPPERS[remapCallback];
			}
			for (const srcA of srcArgs) {
				assignRecursive(srcA, target, remapCallback);
			}
			return target;
		}

		, get2dArray: function (w, h, def) {
			def = def || 0;
			const result = [];
			for (let i = 0; i < w; i++) {
				const inner = [];
				for (let j = 0; j < h; j++) {
					if (def === "array") {
						inner.push([]);
					} else {
						inner.push(def);
					}
				}
				result.push(inner);
			}
			return result;
		}

		, getGuid: function () {
			return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
				let r = Math.random() * 16 | 0;
				let v = (c === "x" ? r : (r & 0x3 | 0x8));
				return v.toString(16);
			});
		}

		, randomKey: function (o) {
			const keys = Object.keys(o);
			return keys[Math.floor(Math.random() * keys.length)];
		}
	};
	if (typeof define === "function") {
		define([], tmpExport);
	} else {
		module.exports = tmpExport;
	}
})();
