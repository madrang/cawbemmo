import client from "/js/system/client.js";
import events from "/js/system/events.js";
import input from "/js/input.js";

export default {
	type: "serverActions"

	, actions: []

	, init: function (blueprint) {
		this.hookEvent("keyup", this.onKeyUp.bind(this));
	}

	, hasAction: function (actionId) {
		return this.actions.some((a) => a.id === actionId);
	}

	, onKeyUp: function (key) {
		if (!input.isKeyAllowed(key)) {
			return;
		}

		this.actions.forEach((a) => {
			if (a.key !== key) {
				return;
			}

			client.request({
				cpn: "player"
				, method: "performAction"
				, data: a.action
			});
		});
	}

	, extend: function (blueprint) {
		if (blueprint.addActions) {
			blueprint.addActions.forEach(function (a) {
				this.actions.spliceWhere((f) => f.key === a.key);

				let exists = this.actions.some(function (ta) {
					return ((ta.targetId === a.targetId) && (ta.cpn === a.cpn) && (ta.method === a.method));
				});
				if (exists) {
					return;
				}

				this.actions.push(a);
			}, this);

			delete blueprint.addActions;
		}

		if (blueprint.removeActions) {
			blueprint.removeActions.forEach(function (a) {
				this.actions.spliceWhere(function (ta) {
					return ((ta.targetId === a.targetId) && (ta.cpn === a.cpn) && (ta.method === a.method));
				});
			}, this);

			delete blueprint.removeActions;
		}

		events.emit("onGetServerActions", this.actions);
	}

	, destroy: function () {
		this.unhookEvents();
	}
};
