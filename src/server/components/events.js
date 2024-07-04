module.exports = {
	type: "events"

	, list: []

	, simplify: function (self) {
		if (!self) {
			return;
		}

		let result = {
			type: "events"
		};

		if (this.list.length > 0) {
			result.list = this.list.map((l) => ({
				id: l.id
				, name: l.config.name
				, description: l.config.description
			}));
		}

		return result;
	}

	, save: function () {
		return {
			type: "events"
		};
	}

	, simplifyTransfer: function () {
		return this.save();
	}

	, unregisterEvent: function (event) {
		this.list.spliceWhere((l) => (l === event));

		this.obj.syncer.setArray(true, "events", "removeList", {
			id: event.id
		});
	}

	, syncList: function () {
		for (const l of this.list) {
			this.obj.syncer.setArray(true, "events", "updateList", {
				id: l.id
				, name: l.config.name
				, description: l.config.description
			});
		}
	}

	, events: {
		afterMove: function () {
			const events = this.obj.instance.events;
			const closeEvents = events.getCloseEvents(this.obj);
			if (!closeEvents) {
				return;
			}
			for (const c of closeEvents) {
				if (this.list.includes(c)) {
					continue;
				}
				this.list.push(c);
				this.obj.syncer.setArray(true, "events", "updateList", {
					id: c.id
					, name: c.config.name
					, description: c.config.description
				});
			}
		}
	}
};
