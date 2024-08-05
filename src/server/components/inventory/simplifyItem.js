//Helpers
const { getById } = require("../../config/factions");

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
			const faction = getById(f.id);
			if (!faction) {
				_.log.simplifyItem.faction.error("Faction '%s' can't be found!", f.id);
				return;
			}
			const tierDefinition = faction.tiers[f.tier];
			return {
				id: f.id
				, tier: f.tier
				, tierName: tierDefinition?.name || null
				, name: faction.name
			};
		}).filter((f) => Boolean(f));
	}
	return result;
};

module.exports = simplifyItem;
