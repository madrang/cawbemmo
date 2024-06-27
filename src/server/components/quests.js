module.exports = {
	type: "quests"
	, quests: []

	, init: function (blueprint) {
		const quests = blueprint.quests || [];
		for (const q of quests) {
			this.obj.instance.questBuilder.obtain(this.obj, q);
		}
		delete blueprint.quests;
		this.blueprint = blueprint;
	}

	, transfer: function () {
		const blueprint = {
			quests: this.quests
		};
		this.quests = [];
		this.init(blueprint);
	}

	, obtain: function (quest, hideMessage) {
		quest.active = (this.obj.zoneName === quest.zoneName);
		this.quests.push(quest);
		if (!quest.init(hideMessage)) {
			this.quests.spliceWhere((q) => (q === quest));
			return false;
		}
		return true;
	}

	, complete: function ({ questId }) {
		const quest = this.quests.find((q) => q.id === questId);
		if (!quest || !quest.isReady) {
			return;
		}
		this.obj.auth.track("quest", "complete", quest.name);
		quest.complete();

		this.quests.spliceWhere((q) => q === quest);

		this.obj.instance.questBuilder.obtain(this.obj);
	}

	, fireEvent: function (event, args) {
		for (const q of this.quests) {
			if (!q || q.completed) {
				continue;
			}
			const events = q.events;
			if (!events) {
				continue;
			}
			const callback = events[event];
			if (!callback) {
				continue;
			}
			callback.apply(q, args);
		}
	}

	, simplify: function (self) {
		if (!self) {
			return;
		}
		const result = {
			type: "quests"
		};
		result.quests = this.quests.map((q) => {
			return q.simplify ? q.simplify(true) : q;
		});
		return result;
	}
};
