module.exports = (scope, map) => {
	const { templates } = scope;
	scope.tileMappings = {};

	let oldMap = map.oldMap;

	templates
		.filter((r) => r.properties.mapping)
		.forEach((m) => {
			const baseTile = (oldMap[m.x][m.y] || "").replace("0,", "").replace(",", "");
			const mapping = scope.tileMappings[baseTile] || (scope.tileMappings[baseTile] = []);
			for (let i = m.x + 2; i < m.x + m.width; i++) {
				for (let j = m.y; j < m.y + m.height; j++) {
					let oM = oldMap[i][j];
					if (oM.replace) {
						oM = oM.replace("0,", "").replace(",", "");
					}
					mapping.push(oM);
				}
			}
		});
};
