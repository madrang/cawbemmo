//eslint-disable-next-line no-extend-native
Object.defineProperty(Array.prototype, "spliceWhere", {
	enumerable: false
	, value: function (callback, thisArg) {
		let T = thisArg;
		let O = Object(this);
		let len = O.length >>> 0;
		let k = 0;
		while (k < len) {
			let kValue;
			if (k in O) {
				kValue = O[k];
				if (callback.call(T, kValue, k, O)) {
					O.splice(k, 1);
					k--;
				}
			}
			k++;
		}
	}
});

//eslint-disable-next-line no-extend-native
Object.defineProperty(Array.prototype, "spliceFirstWhere", {
	enumerable: false
	, value: function (callback, thisArg) {
		let T = thisArg;
		let O = Object(this);
		let len = O.length >>> 0;

		let k = 0;

		while (k < len) {
			let kValue;

			if (k in O) {
				kValue = O[k];

				if (callback.call(T, kValue, k, O)) {
					O.splice(k, 1);
					return kValue;
				}
			}
			k++;
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

const _countRe = function (str, re) {
	if (typeof str !== "string") {
		throw new Error(`str need to be a string but an unexpected type of '${typeof str}' was received.`);
	}
	if (!re) {
		throw new Error("Missing Regex!");
	}
	if (!(re instanceof RegExp) || !re.global) {
		re = new RegExp(re, "gm");
	}
	const reMatches = str.match(re);
	if (!reMatches) {
		return 0;
	}
	return reMatches.length;
};

// Only use _.log.[name].[level](...args) for official logging.
// Temporary logs should use console.log so those instances can be reported by eslint
const _eventLevel = {
	// System is in a situation that poses an immediate risk,
	// require urgent intervention to prevent a worsening of the situation.
	EMERGENCY: 0

	// An error of sufficient magnitude that the system aborted all operations to protect itself.
	, FATAL: 1 << 0

	// An error of sufficient magnitude that it cannot be handled.
	// Should be corrected immediately. Impact system operations.
	, CRITICAL: 1 << 1

	// An error that prevents an operation from completing successfully,
	// Could be handled without affecting the system continued operation.
	// Should be corrected immediately, but the failure is in a secondary system. System remains functional.
	, ERROR: 1 << 2

	// Indication that an error will occur if no action is taken.
	, WARNING: 1 << 3

	// Events that are unusual but not error conditions.
	, NOTICE: 1 << 4

	// Normal operational messages.
	, INFORMATIVE: 1 << 5

	// Debug information that will only need to be seen when tracking down specific problems.
	, DEBUG: 1 << 6

	// Not sure if usefull, use Trace.
	// Spam box, Whatever info that could be usefull...
	, TRACE: 1 << 7

	// All messages will be logged.
	, ALL: 0xFF
};

// Minimal logging, errors and warning only.
_eventLevel.MINIMUM = _eventLevel.FATAL | _eventLevel.CRITICAL | _eventLevel.ERROR | _eventLevel.WARNING;

// Standard messages will be logged.
_eventLevel.STANDARD = _eventLevel.MINIMUM | _eventLevel.NOTICE | _eventLevel.INFORMATIVE;

// Verbose, Standard and Debugging.
// Does not include Trace.
_eventLevel.VERBOSE = _eventLevel.STANDARD | _eventLevel.DEBUG;

let _consoleLogLevel = _eventLevel.STANDARD;
let _consoleLogFilter = function (logger, logLvl, args) {
	return true;
};

const _getColor = function (level) {
	if (!process.env.COLOR || process.env.COLOR === "false") {
		return "";
	}
	switch (level) {
	case _eventLevel.TRACE:
		return "\x1b[34m"; // Blue
	case _eventLevel.DEBUG:
		return "\x1b[36m"; // Cyan
	case _eventLevel.INFORMATIVE:
		return "\x1b[37m"; // White
	case _eventLevel.NOTICE:
		return "\x1b[32m"; // Green
	case _eventLevel.WARNING:
		return "\x1b[33m"; // Yellow
	case _eventLevel.ERROR:
		return "\x1b[31m"; // Red
	case _eventLevel.FATAL:
		return "\x1b[31m"; // Red
	case _eventLevel.CRITICAL:
		return "\x1b[35m"; // Magenta
	case _eventLevel.EMERGENCY:
		return "\x1b[35m"; // Magenta
	default:
		return "\x1b[37m"; // White
	}
};
const _mapArgsToString = function (...args) {
	return args.map((a) => {
		const aType = typeof a;
		if (aType === "undefined") {
			return "undefined";
		} else if (aType === "string") {
			return a;
		} else if (typeof a.toString === "function") {
			return a.toString();
		}
		try { // Converting circular structure to JSON
			return JSON.stringify(a, undefined, 4);
		} catch (ex) {
			return ex.toString();
		}
	});
};
const _applyLogFn = function (thisLogger, logLevel, logFn, args) {
	if (typeof logFn === "string") {
		const fnName = logFn;
		logFn = console[fnName];
	}
	if (typeof logFn !== "function") {
		throw new Error("logFn is not a function.");
	}
	let msgIdx;
	const msgParts = [];
	const color = _getColor(logLevel);
	//const message = _mapArgsToString(...args).join('');
	if (typeof args[0] === "string") { //Starts with string message
		const msg = args.shift();
		if (typeof thisLogger?.name !== "undefined" && thisLogger.name !== "System") {
			if (process.env.COLOR && process.env.COLOR !== "false") {
				msgParts.push(color);
				msgParts.push(`\x1b[1m${thisLogger.name} -->\x1b[0m `);
			} else {
				msgParts.push(`${thisLogger.name} --> `);
			}
			msgParts.push(msg);
		}
		msgIdx = _countRe(msg, "%[cso]");
	} else {
		// Begins with an object
		// Add missing start messge
		if (process.env.COLOR && process.env.COLOR !== "false") {
			msgParts.push(color);
			msgParts.push(`\x1b[1m${thisLogger.name}-->\x1b[0m %o`);
		} else {
			msgParts.push(`${thisLogger.name} --> %o`);
		}
		msgIdx = 1;
	}
	const arLen = args.length;
	for (let iter = msgIdx; iter < arLen; ++iter) {
		if (typeof args[iter] === "string") {
			msgParts.push(" %s");
		} else {
			msgParts.push(" %o");
		}
	}
	args.unshift(msgParts.join(""));
	logFn.apply(console, args);
};
const _consoleFnNames = {
	error: _eventLevel.ERROR
	 , warn: _eventLevel.WARNING
	 , info: _eventLevel.NOTICE
	 , debug: _eventLevel.DEBUG
	 , trace: _eventLevel.TRACE
};
const _printEvent = function (thisLogger, logLevel, args) {
	if (!Number.isInteger(logLevel) || (logLevel !== 0 && (logLevel & _consoleLogLevel) === 0)) {
		return;
	}
	for (let n in _consoleFnNames) {
		if (_consoleFnNames[n] >= logLevel) {
			//eslint-disable-next-line no-console
			_applyLogFn(thisLogger, logLevel, console[n], args);
			break;
		}
		if (n == "trace") { //Last item...
			//eslint-disable-next-line no-console
			_applyLogFn(thisLogger, logLevel, console.trace, args);
		}
	}
	// Send notifications
	//if (logLevel === _eventLevel.EMERGENCY) {
	//TODO Send email on emergencies.
	//email.notify(message);
	//}
};
const _logBase = function (name) {
	if (typeof name === "undefined") {
		throw new Error("Name is undefined.");
	} else if (typeof name === "string") {
		this.name = name;
	} else {
		throw new Error("Name is not a string.");
	}
};
//Add log functions.
for (const levelName in _eventLevel) {
	const logLvl = _eventLevel[levelName];
	_logBase.prototype[levelName.toLowerCase()] = function (...args) {
		if (!_consoleLogFilter(this, logLvl, args)) {
			return;
		}
		_printEvent(this, logLvl, args);
	};
}
_logBase.prototype.info = _logBase.prototype.informative;
_logBase.prototype.warn = _logBase.prototype.warning;

const _logHandler = Object.create(null);
_logHandler.set = function (target, propertyKey, value, receiver) {
	Reflect.set(target, propertyKey, value, receiver);
};
const _createLogger = function (parentLogger, name) {
	let newLoggerName;
	if (typeof parentLogger === "string" && typeof name === "undefined") {
		//Name was passed as first arg.
		newLoggerName = parentLogger;
	} else if (typeof name === "string") {
		if (typeof parentLogger === "object" && typeof parentLogger.name === "string" && parentLogger.name !== "System") {
			newLoggerName = [parentLogger.name, "->", name].join("");
		} else {
			//No parent.
			newLoggerName = name;
		}
	} else {
		throw new Error("Name is not a string.");
	}
	return new Proxy(new _logBase(newLoggerName), _logHandler);
};
_logHandler.get = function (target, propertyKey) {
	const propType = typeof propertyKey;
	if (propType === "undefined") {
		throw new Error("propertyKey is undefined.");
	}
	if (propertyKey in target) {
		return Reflect.get(target, propertyKey);
	}
	if (propType === "object") {
		//WeakMap keys must be objects, not primitive values
		let weakLogMap;
		if (typeof target.__weakLogMap === "undefined") {
			weakLogMap = new WeakMap();
			target.__weakLogMap = weakLogMap;
		} else {
			weakLogMap = target.__weakLogMap;
		}
		if (weakLogMap.has(propertyKey)) {
			return weakLogMap.get(propertyKey);
		}
		let newLoggerName;
		if (typeof propertyKey.name === "string") {
			newLoggerName = propertyKey.name;
		} else if (typeof propertyKey.toString === "function") {
			newLoggerName = propertyKey.toString();
		} else {
			//If function, propertyKey.displayName
			newLoggerName = propertyKey.prototype.name;
		}
		const newLog = _createLogger(target, newLoggerName);
		weakLogMap.set(propertyKey, newLog);
		return newLog;
	}
	return _createLogger(target, propertyKey);
};
Object.freeze(_logHandler);

module.exports = {
	get2dArray: function (w, h, def) {
		def = def || 0;
		let result = [];
		for (let i = 0; i < w; i++) {
			let inner = [];
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
	, randomKey: function (o) {
		const keys = Object.keys(o);
		return keys[Math.floor(Math.random() * keys.length)];
	}
	, countRe: _countRe
	, getDeepProperty: function (obj, path) {
		if (!path.push) {
			path = path.split(".");
		}
		let o = obj;
		let pLen = path.length;
		for (let i = 0; i < pLen; i++) {
			o = o[path[i]];
			if (!o) {
				return null;
			}
		}
		return o;
	}

	, getGuid: function () {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
			let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	, safeRequire: function (path) {
		try {
			return require(path);
		} catch (e) {
			_.log.NodeJS.error(`Failed to import "${path}" Error:`, e);
		}
	}

	, log: _createLogger("System")
};
