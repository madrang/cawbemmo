import client from "/js/system/client.js";
import events from "/js/system/events.js";
//import factory from "ui/factory";

export default {
	type: "dialogue"

	, init: function () {

	}

	, talk: function (target) {
		client.request({
			cpn: "player"
			, method: "performAction"
			, data: {
				cpn: "dialogue"
				, method: "talk"
				, data: {
					target: target.id
				}
			}
		});
	}

	, extend: function (blueprint) {
		events.emit("onGetTalk", blueprint.state);
	}
};
