let itemGenerator = require("../../../../items/generator");

module.exports = (config, crafter) => {
	const slot = config.slot || _.getRandomFrom("oneHanded", "twoHanded");
	const result = itemGenerator.generate({
		noSpell: true
		, slot
		, ...config
	});
	crafter.inventory.getItem(result, false, false, false, true);
	const msg = `You received: ${result.name}`;
	return { msg };
};
