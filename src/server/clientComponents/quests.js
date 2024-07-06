define([
	"js/system/events"
], function (
	events
) {
	return {
		type: "quests"
		, quests: []

		, init: function () {
			for (const q of this.quests) {
				events.emit("onObtainQuest", q);
			}
		}

		, extend: function (blueprint) {
			if (blueprint.updateQuests) {
				for (const q of blueprint.updateQuests) {
					events.emit("onUpdateQuest", q);
					let index = this.quests.findIndex((f) => f.id === q.id);
					this.quests.splice(index, 1, q);
				}
			}
			if (blueprint.completeQuests) {
				for (const q of blueprint.completeQuests) {
					events.emit("onCompleteQuest", q);
					this.quests.spliceWhere((qq) => qq.id === q);
				}
			}
			if (blueprint.obtainQuests) {
				for (const q of blueprint.obtainQuests) {
					events.emit("onObtainQuest", q);
					this.quests.push(q);
				}
			}
		}
	};
});
