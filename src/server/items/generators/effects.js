const rollValues = (rollsDefinition, result) => {
	for (let p in rollsDefinition) {
		const entry = rollsDefinition[p];

		if (typeof(entry) === 'object' && !Array.isArray(entry) && entry !== null) {
			const newResult = {};

			result[p] = newResult;

			rollValues(entry, newResult);

			continue;
		}

		const range = entry;
		const isInt = (p.indexOf('i_') === 0);
		const fieldName = p.replace('i_', '');

		if (!Array.isArray(entry) || p.indexOf('s_') === 0) {
			result[fieldName] = range;

			continue;
		}

		let value = range[0] + (Math.random() * (range[1] - range[0]));
		if (isInt)
			value = ~~value;

		result[fieldName] = value;
	}
};

module.exports = {
	generate: function (item, blueprint) {
		if (!blueprint.effects)
			return;

		item.effects = blueprint.effects.map(function (e) {
			let rolls = e.rolls;
			let newRolls = {};

			rollValues(rolls, newRolls);

			return {
				type: e.type,
				properties: e.properties,
				rolls: newRolls
			};
		});
	}
};
