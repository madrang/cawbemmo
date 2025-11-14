//import events from "/js/system/events.js";
//import client from "/js/system/client.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const tpl = await _.loadHTML("/ui/templates/progressBar/template.html", { raw: true });
const tplBar = await _.loadHTML("/ui/templates/progressBar/templateBar.html", { raw: true });

export default {
	tpl: tpl

	, bars: []

	, postRender: function () {
		this.onEvent("onShowProgress", this.onShowProgress.bind(this));
	}

	, onShowProgress: function (text, percentage) {
		let bar = this.bars.find(function (b) {
			return (b.text === text);
		});

		if (bar) {
			if (percentage >= 100) {
				bar.el.remove();
				this.bars.spliceWhere(function (b) {
					return (b === bar);
				});
			} else {
				bar.el.find(".bar").css("width", percentage + "%");
			}
		} else if (percentage < 100) {
			bar = $(tplBar).appendTo(this.el);
			bar.find(".bar").css("width", percentage + "%");
			bar.find(".text").html(text);

			this.bars.push({
				text: text
				, el: bar
			});
		}
	}
};
