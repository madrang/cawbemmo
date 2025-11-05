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
	return {
		currentLocale: null
		, availableLanguages: [ "en", "fr" ]
		, stats: {}
		, init: async function () {
			if (!this.currentLocale) {
				this.currentLocale = this.getLang();
			}
			const langData = await new Promise((res) => require([`js/locale/${this.currentLocale}`], res));
			_.assign(this, langData);
		}
		, getLang: function () {
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
		, translate: function (propName) {
			if (this.stats.has(propName)) {
				return this.stats[propName];
			}
			throw new Error(`propName "${propName}" couldn't be translated!`);
		}
	};
});
