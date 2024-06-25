define([

], function (

) {
	const colors = [
		"929398"
		, "80f643"
		, "3fa7dd"
		, "a24eff"
		, "ffeb38"
	];

	const chances = [
		0.0075
		, 0.02
		, 0.04
		, 0.08
		, 0.095
	];

	const indices = {
		50: 0
		, 51: 1
		, 128: 2
		, 52: 3
		, 53: 4
	};

	return {
		type: "chest"

		, ownerName: null

		, init: function (blueprint) {
			const index = indices[this.obj.cell] || 0;

			this.obj.addComponent("particles", {
				chance: chances[index]
				, blueprint: {
					lifetime: { min: 1, max: 4 }
					, behaviors: [
						{ type: "color"
							, config: {
								color: {
									list: [
										{ time: 0, value: [ colors[index] ] }
										, { time: 1, value: [ colors[index] ] }
									]
								}
							}
						}
						, { type: "alpha"
							, config: {
								alpha: {
									list: [
										{ time: 0, value: 0.75 }
										, { time: 1, value: 0.2 }
									]
								}
							}
						}
						, { type: "spawnShape"
							, config: {
								type: "rect"
								, data: { x: -4, y: -4, w: 8, h: 8 }
							}
						}
					]
					, spawnChance: chances[index]
				}
			});
		}
	};
});
