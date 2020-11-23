module.exports = {
	generate: function (item, blueprint) {
		if (item.originalLevel) 
			item.worth = ~~(Math.pow(item.originalLevel, 1.5) + (Math.pow((item.quality + 1), 2) * 10));
		else
			item.worth = ~~(Math.pow(item.level, 1.5) + (Math.pow((item.quality + 1), 2) * 10));

		if (item.spell)
			item.worth *= 5;
	}
};
