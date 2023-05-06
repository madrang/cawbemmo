//Helpers
const { getFactionBlueprint } = require('../../config/factions/helpers');

//Internals
const tierNames = ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'];

//Method
const simplifyItem = (cpnInventory, item) => {
	const result = extend({}, item);

	if (result.effects) {
		result.effects = result.effects.map(e => ({
			factionId: e.factionId ?? null,
			text: e.text ?? null,
			properties: e.properties ?? null,
			type: e.type ?? null,
			rolls: e.rolls ?? null
		}));
	}

	if (result.factions) {
		result.factions = result.factions.map(f => {
			const res = {
				id: f.id,
				tier: f.tier,
				tierName: tierNames[f.tier],
				name: getFactionBlueprint(f.id).name
			};

			return res;
		});
	}

	return result;
};

module.exports = simplifyItem;
