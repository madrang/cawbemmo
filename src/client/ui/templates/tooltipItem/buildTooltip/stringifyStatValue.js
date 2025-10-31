define([
], (
) => {
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
	const stringifyStatValue = (statName, statValue) => {
		if (statName.includes("CritChance")) {
			statValue = statValue / 20;
		}
		if (percentageStats.includes(statName) || statName.includes("Percent")
			|| (statName.startsWith("element") && !statName.includes("Resist"))
		) {
			statValue += "%";
		}
		return statValue + "";
	};
	return stringifyStatValue;
});
