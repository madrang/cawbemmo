define([
	"js/system/events"
	, "js/system/client"
	, "html!ui/templates/talk/template"
	, "css!ui/templates/talk/styles"
	, "html!ui/templates/talk/tplOption"
], function (
	events,
	client,
	template,
	styles,
	tplOption
) {
	return {
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
});
