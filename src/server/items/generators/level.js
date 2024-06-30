module.exports = {
	generate: function (item, blueprint) {
		const level = blueprint.level;
		if (Array.isArray(level)) {
			item.level = level[0] + Math.floor(Math.random() * (level[1] - level[0]));
			return;
		}
		item.level = Math.floor(level || 1);
	}
};
