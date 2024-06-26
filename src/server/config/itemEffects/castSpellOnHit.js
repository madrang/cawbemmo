//Imports
const spellBaseTemplate = require("../spells/spellTemplate");

//Helpers
const getItemEffect = (item) => {
	return item.effects.find((e) => (e.type === "castSpellOnHit"));
};

const doesEventMatch = (firedEvent, eventCondition) => {
	if (
		!firedEvent ||
		(
			eventCondition.targetNotSelf === false &&
			firedEvent.target === firedEvent.source
		)
	) {
		return false;
	}

	const foundNonMatch = Object.entries(eventCondition).some(([k, v]) => {
		if (v !== null && typeof(v) === "object") {
			if (!doesEventMatch(firedEvent[k], v)) {
				return true;
			}

			return false;
		}

		return firedEvent[k] !== v;
	});

	return !foundNonMatch;
};

const shouldApplyEffect = (itemEffect, firedEvent, firedEventName) => {
	const { rolls: { chance, combatEvent: { [firedEventName]: eventCondition } } } = itemEffect;

	if (!eventCondition || !doesEventMatch(firedEvent, eventCondition)) {
		return false;
	}

	if (chance !== undefined && Math.random() * 100 >= chance) {
		return false;
	}

	return true;
};

const handler = (obj, item, event, firedEventName) => {
	const itemEffect = getItemEffect(item);

	if (!shouldApplyEffect(itemEffect, event, firedEventName)) {
		return;
	}

	const { rolls: { castSpell, castTarget } } = itemEffect;

	const spellConfig = _.assign({}, castSpell);
	spellConfig.noEvents = true;

	const scaleDamage = spellConfig.scaleDamage;
	delete spellConfig.scaleDamage;

	if (scaleDamage) {
		if (scaleDamage.useOriginal) {
			scaleDamage.useOriginal.forEach((s) => {
				spellConfig[s] = event.spell[s];
			});
		}

		if (scaleDamage.percentage) {
			spellConfig.damage *= (scaleDamage.percentage / 100);
		}
	}

	const typeTemplate = {
		type: spellConfig.type[0].toUpperCase() + spellConfig.type.substr(1)
		, template: null
	};
	obj.instance.eventEmitter.emit("onBeforeGetSpellTemplate", typeTemplate);

	if (!typeTemplate.template) {
		typeTemplate.template = require("../spells/spell" + typeTemplate.type);
	}

	const builtSpell = _.assign({ obj }, spellBaseTemplate, typeTemplate.template, spellConfig);

	let target = event.target;
	if (castTarget === "self") {
		target = obj;
	} else if (castTarget === "none") {
		target = undefined;
	}
	//Need to write a generic way to apply these
	else if (castTarget === "{{event.oldPos}}") {
		target = _.assign({}, event.oldPos);
	} else if (JSON.stringify(castTarget) === "{\"x\":\"{{event.follower.x}}\",\"y\":\"{{event.follower.y}}\"}") {
		target = {
			x: event.follower.x
			, y: event.follower.y
		};
	}

	builtSpell.cast({ target });
};

//Effect
module.exports = {
	events: {
		afterGiveHp: function (item, event) {
			handler(this, item, event, "afterGiveHp");
		}

		, afterDealDamage: function (item, event) {
			handler(this, item, event, "afterDealDamage");
		}

		, afterPositionChange: function (item, event) {
			handler(this, item, event, "afterPositionChange");
		}

		, afterFollowerDeath: function (item, event) {
			handler(this, item, event, "afterFollowerDeath");
		}
	}
};
