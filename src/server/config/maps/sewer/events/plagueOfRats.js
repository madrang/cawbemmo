const { mobs: { rat: { level, faction, grantRep, regular: { drops } } } } = require('../zone');

/*
Steps:

1. Bandit runs in
2. Bandit pours liquid into grate
3. Bandit says that rats will now become enraged and attack the city
4. Bandit laughs
5. Bandit runs away
6. Giant Rat spawns every 5 seconds
7. Giant Rat spawns every 3 seconds
8. Giant Rat spawns every 1 second
9. 5 Enraged Rats spawn

Note: All rats run to sewer exit
Note: Keep track of escapees and if you reach x, you fail
Note: Chest spawns that everyone can loot
*/

const rat = {
	name: 'Swarmer Rat',
	cell: 16,
	level,
	faction,
	grantRep,
	drops,
	hpMult: 1,
	pos: {
		x: 61,
		y: 62
	},
	originX: 97,
	originY: 87,
	maxChaseDistance: 1000,
	spells: [{
		type: 'smokeBomb',
		radius: 1,
		duration: 20,
		range: 2,
		selfCast: 1,
		statMult: 1,
		damage: 0.125,
		element: 'poison',
		cdMax: 5,
		particles: {
			scale: {
				start: {
					min: 10,
					max: 25
				},
				end: {
					min: 10,
					max: 0
				}
			},
			opacity: {
				start: 0.3,
				end: 0
			},
			lifetime: {
				min: 1,
				max: 2
			},
			speed: {
				start: 3,
				end: 0
			},
			color: {
				start: ['4ac441', '953f36'],
				end: ['393268', '386646']
			},
			chance: 0.125,
			randomColor: true,
			randomScale: true,
			blendMode: 'add',
			spawnType: 'rect',
			spawnRect: {
				x: -10,
				y: -10,
				w: 20,
				h: 20
			}
		}
	}]
};

module.exports = {
	name: 'Plague of Rats',
	description: 'Oh lawd, they comin\'',
	distance: -1,
	cron: '*/10 * * * *',

	phases: [{
		type: 'spawnMob',
		mobs: [rat],
		auto: true
	}, {
		type: 'wait',
		ttl: 15
	}, {
		type: 'goto',
		gotoPhaseIndex: 0,
		repeats: 5
	},
	{
		type: 'spawnMob',
		mobs: [rat],
		auto: true
	}, {
		type: 'wait',
		ttl: 7
	}, {
		type: 'goto',
		gotoPhaseIndex: 3,
		repeats: 5
	},
	{
		type: 'spawnMob',
		mobs: [rat],
		auto: true
	}, {
		type: 'wait',
		ttl: 3
	}, {
		type: 'goto',
		gotoPhaseIndex: 6,
		repeats: 3
	},
	{
		type: 'killAllMobs'
	}]
};
