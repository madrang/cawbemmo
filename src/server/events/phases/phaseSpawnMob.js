let mobBuilder = require("../../world/mobBuilder");

const buildMob = (objects, mobConfig, x, y, mobIndex) => {
	const { id, sheetName="mobs", cell, name, properties, originX, originY, maxChaseDistance, dialogue, trade, chats, events } = mobConfig;

	const mob = objects.buildObjects([{
		x, y
		, sheetName
		, cell
		, name
		, properties
	}]);
	mobBuilder.build(mob, mobConfig);

	if (id) {
		mob.id = id.replaceAll("$", mobIndex);
	}
	if (originX && originY) {
		mob.mob.originX = originX;
		mob.mob.originY = originY;
		mob.mob.goHome = true;
		mob.mob.maxChaseDistance = maxChaseDistance || 8;
		//This is a hack to make mobs that run somewhere able to take damage
		delete mob.mob.events.beforeTakeDamage;
	}
	if (dialogue) {
		mob.addComponent("dialogue", {
			config: dialogue.config
		});
		if (dialogue.auto) {
			mob.dialogue.trigger = objects.buildObjects([{
				properties: {
					x: mob.x - 1
					, y: mob.y - 1
					, width: 3
					, height: 3
					, cpnNotice: {
						actions: {
							enter: {
								cpn: "dialogue"
								, method: "talk"
								, args: [{
									targetName: mob.name.toLowerCase()
								}]
							}
							, exit: {
								cpn: "dialogue"
								, method: "stopTalk"
							}
						}
					}
				}
			}]);
		}
	}
	if (trade) {
		mob.addComponent("trade", trade);
	}
	if (chats) {
		mob.addComponent("chatter", chats);
	}
	if (events) {
		mob.addBuiltComponent({
			type: "eventComponent"
			, events: events
		});
	}
	if (mobConfig.needLos !== undefined) {
		mob.mob.needLos = mobConfig.needLos;
	}
	if (mobConfig.spawnHpPercent) {
		mob.stats.values.hp = (mob.stats.values.hpMax * mobConfig.spawnHpPercent);
	}
	return mob;
};

const spawnAnimation = (syncer, { x, y }) => {
	syncer.queue("onGetObject", {
		x, y
		, components: [{
			type: "attackAnimation"
			, row: 0, col: 4
		}]
	}, -1);
};

const getPosXY = function(pos, index=0) {
	if (!pos) {
		return;
	}
	if (typeof pos === "function") {
		pos = pos(index);
	}
	if (Array.isArray(pos)) {
		if (pos.length === 2 && typeof pos[0] !== "object" && typeof pos[1] !== "object") {
			return pos;
		}
		const item = pos[index];
		if (Array.isArray(item) && item.length === 2) {
			return item;
		}
		if (typeof item === "object") {
			return [ item.x, item.y ];
		}
	}
	if (typeof pos === "object") {
		return [ pos.x, pos.y ];
	}
	throw new Error("Invalid format!");
};

module.exports = {
	spawnRect: null
	, mobs: null

	, init: function () {
		const { spawnRect, instance: { objects, syncer } } = this;
		if (!this.mobs.push) {
			this.mobs = [this.mobs];
		}
		const freeSpots = _.getPositions(spawnRect);
		for (const l of this.mobs) {
			const amount = (l.exists ? 1 : (l.amount || 1));
			delete l.amount;
			l.walkDistance = 0;
			for (let i = 0; i < amount; i++) {
				let x, y;
				if (l.pos) {
					[ x, y ] = getPosXY(l.pos);
					if (spawnRect) {
						x += spawnRect.x;
						y += spawnRect.y;
					}
				} else if (freeSpots?.length > 0) {
					[ x, y ]  = _.randomObj(freeSpots);
				} else if (spawnRect) {
					x = _.randomInt(spawnRect.x, spawnRect.x + (spawnRect.w || 1));
					y = _.randomInt(spawnRect.y, spawnRect.y + (spawnRect.h || 1));
				} else {
					_.log.phaseSpawnMob.error("No position for mob object '%s'!", l.name);
					continue;
				}
				if (freeSpots?.length > 0) {
					freeSpots.spliceWhere((p) => p[0] === x && p[1] === y);
				}
				if (l.exists) {
					const mob = objects.objects.find((o) => (o.name === l.name));
					if (!mob) {
						_.log.phaseSpawnMob.error("Mob object '%s' not found.", l.name);
						continue;
					}
					mob.mob.walkDistance = 0;
					spawnAnimation(syncer, mob);
					mob.performMove({
						force: true
						, data: { x, y }
					});
					spawnAnimation(syncer, mob);
					this.event.objects.push(mob);
					continue;
				} else {
					if (!l.has("originX")) {
						l.originX = x;
					}
					if (!l.has("originY")) {
						l.originY = y;
					}
					const mob = buildMob(objects, l, x, y, i);
					this.event.objects.push(mob);
					mob.event = this.event;
					spawnAnimation(syncer, mob);
				}
			}
		}
		if (!this.endMark) {
			this.end = true;
		}
	}
};
