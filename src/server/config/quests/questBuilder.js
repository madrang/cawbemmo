//Imports
const questTemplate = require("./templates/questTemplate");
const globalQuests = require("../questsBase");
const { mapList } = require("../../world/mapManager");

//Exports
module.exports = {
	instance: null

	, init: function (instance) {
		this.instance = instance;
	}

	, obtain: function (obj, template) {
		const zoneName = template?.zoneName ?? obj.zoneName;
		const zone = mapList.find((m) => m.name === zoneName);
		if (!zone) { // Zone doesn't exist any more. Probably been renamed
			return;
		}
		let oQuests = obj.quests;
		if (oQuests.quests.filter((q) => q.zoneName === zoneName).length > 0) {
			return;
		}
		let zoneTemplate = null;
		try {
			zoneTemplate = require(`../../${zone.path}/${zoneName}/quests.js`);
		} catch (e) {
			zoneTemplate = globalQuests;
			_.log.questBuilder.error(e);
		}

		if (!zoneTemplate) {
			zoneTemplate = globalQuests;
		}
		const config = _.assign({}, zoneTemplate);
		this.instance.eventEmitter.emit("onBeforeGetQuests", {
			obj
			, config
			, zoneName
			, template
		});
		if (config.infini.length === 0) {
			return;
		}
		//Only check min level of quests when physically in the zone they belong to
		if (obj.zoneName === zoneName) {
			const minPlayerLevel = Math.floor(obj.instance.zoneConfig.level[0] * 0.75);
			if (obj.stats.values.level < minPlayerLevel) {
				return;
			}
		}

		let pickQuest = null;
		if ((template) && (template.type)) {
			pickQuest = config.infini.find((c) => c.type === template.type);
		}
		if (!pickQuest) {
			pickQuest = config.infini[Math.floor(Math.random() * config.infini.length)];
		}
		const pickType = pickQuest.type[0].toUpperCase() + pickQuest.type.substr(1);
		const questClass = require(`../../config/quests/templates/quest${pickType}`);
		const quest = _.assign({}, pickQuest, questTemplate, questClass, template);
		if (template) {
			quest.xp = template.xp;
		}

		//Calculate next id
		let id = 0;
		for (let q of oQuests.quests) {
			if (q.id >= id) {
				id = q.id + 1;
			}
		}
		quest.id = id;
		quest.obj = obj;
		quest.zoneName = zoneName;
		if (!oQuests.obtain(quest, Boolean(template))) {
			this.obtain(obj, template);
		}
	}
};
