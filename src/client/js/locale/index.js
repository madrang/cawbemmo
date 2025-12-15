import events from "/js/system/events.js";

const percentageStats = [
	"addCritChance"
	, "addCritMultiplier"
	, "addAttackCritChance"
	, "addAttackCritMultiplier"
	, "addSpellCritChance"
	, "addSpellCritMultiplier"
	, "sprintChance"
	, "xpIncrease"
	, "blockAttackChance"
	, "blockSpellChance"
	, "dodgeAttackChance"
	, "dodgeSpellChance"
	, "attackSpeed"
	, "castSpeed"
	, "itemQuantity"
	, "magicFind"
	, "catchChance"
	, "catchSpeed"
	, "fishRarity"
	, "fishWeight"
	, "fishItems"
];

const getMessage = function getMessage (target, nParts, curPath = []) {
	if (!Array.isArray(nParts) || nParts.length <= 0) {
		return target;
	}
	if (typeof target !== "object") {
		_.log.locale.getMessage.error(`Current path ${curPath.join(".")} is missing ${nParts.join(".")}`);
		return undefined;
	}
	const np = nParts.shift();
	const subTarget = target[np];
	curPath.push(np);

	if (!subTarget) {
		_.log.locale.getMessage.error(curPath.join(".") + " not found.");
		return undefined;
	}
	return getMessage(subTarget, nParts, curPath);
};

const _reLocAllMsg = new RegExp("\\${(\\S+?)}", "gm");
const getLocalizedMessage = function getLocalizedMessage (dictionary, message) {
	// Parse messages and replace localized strings tokens when found.
	// Return unmoddified message if not a localized string.
	if (!dictionary) {
		throw new Error("Missing dictionary!");
	}
	if (typeof message !== "string") {
		return message;
	}
	const logger = _.log.getLocalizedMessage;
	return message.replaceAll(_reLocAllMsg, (match, msgName, offset, curString) => {
		msgName = msgName.trim();
		if (!msgName) {
			logger.warn(`The localised message "${match}" is invalid as it results into an empty name.`);
			return match;
		}
		logger.trace(`Looking for "${msgName}"`);
		if (!msgName.includes(".")) {
			if (typeof dictionary === "object" && Object.prototype.has.call(dictionary, msgName)) {
				return dictionary[msgName];
			} else if (typeof dictionary === "function") {
				return dictionary(msgName);
			}
			return msgName;
		}
		const nameParts = msgName.split(".");
		if (typeof dictionary === "function") {
			const strMsg = dictionary(...nameParts);
			if (strMsg === undefined || strMsg === null) {
				logger.error(`dictionary("${msgName}") returned an empty value!`);
				return msgName;
			}
			return strMsg;
		} else if (typeof dictionary === "object") {
			return getMessage(dictionary, nameParts);
		}
		logger.error(`dictionary "${dictionary}" does not declare "${msgName}"`);
		logger.trace(dictionary);
		return msgName;
	});
};

/** Localize an HTML structure using the current locale.
 * @static
 * @param {(Node|String)} element - HTML Node.
 * @returns the element after localisation.
 */
const localizeHTML = function localizeHTML (dictionary, element) {
	if (element instanceof Node) {
		if (element.nodeName === "TEMPLATE") {
			for (const node of element.content.childNodes.values()) {
				localizeHTML(dictionary, node);
			}
			return element;
		}
		const hasChildNodes = element.hasChildNodes();
		if (element instanceof Element) {
			if (element.hasAttributes()) {
				const attrs = element.attributes;
				for (let i = attrs.length - 1; i >= 0; --i) {
					const attrib = attrs[i];
					const attrVal = attrib.value;
					attrib.value = getLocalizedMessage(dictionary, attrVal);
					if (attrib.value !== attrVal) {
						_.log.localizeHTML.debug(`Node: ${element.nodeName}, Attribute "${attrs[i]}" tranlated.`);
					}
				}
			}
			if (element instanceof HTMLElement) {
				if (!hasChildNodes) {
					element.innerText = getLocalizedMessage(dictionary, element.innerText);
				}
			} else if (element instanceof SVGElement) {
				_.log.localizeHTML.warn("SVG elements are unsupported. Returning unmoddified element");
			} else {
				_.log.localizeHTML.warn(`Unknown element "${element.id}" Returning unmoddified element %o`, element);
			}
		} else if (
			// Text based nodes.
			element.nodeType === Node.COMMENT_NODE
			|| element.nodeType === Node.TEXT_NODE
			|| element instanceof CDATASection
			|| element instanceof Comment
			|| element instanceof Text
		) {
			element.nodeValue = getLocalizedMessage(dictionary, element.nodeValue);
		} else if (element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
			_.log.localizeHTML.warn(`Unknown node type "${element.nodeName}.nodeType: ${element.nodeType}`);
		}
		if (hasChildNodes) {
			for (const node of element.childNodes.values()) {
				localizeHTML(dictionary, node);
			}
		}
	} else if (typeof element === "string") {
		// HTML element string
		// <p>${propName}</p>
		return getLocalizedMessage(dictionary, element);
	} else {
		_.log.localizeHTML.warn("Unknown instance type \"%o\" is unsupported.", element);
	}
	return element;
};

export default {
	language: null
	, availableLanguages: [ "en", "fr" ]
	, dictionary: {}

	, init: async function (language) {
		if (language && !this.availableLanguages.includes(language)) {
			throw new Error(`Language ${language} isn't available!`);
		}
		if (!this.language || language) {
			this.language = language || this.getLanguage();
		}
		this.dictionary = await import(`/js/locale/${this.language}.js`);
		await events.emit("onGetTranslation", {
			locale: this
			, language: this.language
			, dictionary: this.dictionary
		});
	}
	, getLanguage: function () {
		if (navigator.languages) {
			for (const lc of navigator.languages) {
				if (this.availableLanguages.includes(lc)) {
					return lc;
				}
			}
		}
		if (navigator.language && this.availableLanguages.includes(navigator.language)) {
			return navigator.language;
		}
		return this.availableLanguages[0];
	}

	, getLocalizedMessage
	, getMessage
	, localizeHTML

	, stringifyStatValue: function (statName, statValue) {
		if (statName.includes("CritChance")) {
			statValue = statValue / 20;
		}
		if (percentageStats.includes(statName) || statName.includes("Percent")
			|| (statName.startsWith("element") && !statName.includes("Resist"))
		) {
			statValue += "%";
		}
		return statValue + "";
	}

	, translate: function (...propNames) {
		let replDict;
		const lastPropType = (propNames.length > 0 ? typeof propNames[propNames.length - 1] : undefined);
		if (lastPropType === "object") {
			replDict = Object.assign({}, this.dictionary, propNames.pop());
		} else if (lastPropType === "function") {
			replDict = propNames.pop();
		} else {
			replDict = this.dictionary;
		}

		const msg = getMessage(this.dictionary, propNames);
		if (typeof msg !== "string") {
			throw new Error(`propName "${propNames.join(".")}" couldn't be translated!`);
		}
		return getLocalizedMessage(replDict, msg);
	}
};
