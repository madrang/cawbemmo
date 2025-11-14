//import events from "/js/system/events.js";
import client from "/js/system/client.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/talk/template.html", { raw: true });
const tplOption = await _.loadHTML("/ui/templates/talk/tplOption.html", { raw: true });

export default {
	tpl: template
	, modal: true

	, postRender: function () {
		this.onEvent("onGetTalk", this.onGetTalk.bind(this));
		this.onEvent("clearUis", this.hide.bind(this));
	}

	, onGetTalk: function (dialogue) {
		this.state = dialogue;
		if (!dialogue) {
			this.hide();
			return;
		}
		this.show();
		this.find(".name").html(dialogue.from);
		this.find(".msg").html(`"${dialogue.msg}"`);
		const options = this.find(".options").empty();
		dialogue.options.forEach(function (o) {
			$(tplOption)
				.appendTo(options)
				.html("- " + o.msg)
				.on("click", this.onReply.bind(this, o));
		}, this);
		this.center(true, false);
	}

	, onReply: function (option) {
		client.request({
			cpn: "player"
			, method: "performAction"
			, data: {
				cpn: "dialogue"
				, method: "talk"
				, data: {
					target: this.state.id
					, state: option.id
				}
			}
		});
	}
};
