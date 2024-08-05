//Helpers
const { getById } = require("../../config/factions");

//Internals
const tierNames = [
	"Hated"
	, "Hostile"
	, "Unfriendly"
	, "Neutral"
	, "Friendly"
	, "Honored"
	, "Revered"
	, "Exalted"
];

//Method
const simplifyItem = (cpnInventory, item) => {
	const result = _.assign({}, item);

	if (result.effects) {
		result.effects = result.effects.map((e) => ({
			factionId: e.factionId ?? null
			, text: e.text ?? null
			, properties: e.properties ?? null
			, type: e.type ?? null
			, rolls: e.rolls ?? null
		}));
	}

	if (result.factions) {
		result.factions = result.factions.map((f) => {
			const res = {
				id: f.id
				, tier: f.tier
				, tierName: tierNames[f.tier]
				, name: getById(f.id).name
			};

			return res;
		});
	}

	return result;
};

module.exports = simplifyItem;
