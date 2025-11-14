//import events from "/js/system/events.js";
import client from "/js/system/client.js";
import uiFactory from "/ui/factory.js";
import renderer from "/js/rendering/renderer.js";
import globals from "/js/system/globals.js";

import styles from "./styles.css" with { type: "css" };
if (!document.adoptedStyleSheets.includes(styles)) {
	document.adoptedStyleSheets.push(styles);
}

const template = await _.loadHTML("/ui/templates/login/template.html", { raw: true });

export default {
	tpl: template
	, centered: true

	, beforeRender: function () {
		const { clientConfig: { logoPath, changeLog } } = globals;
		// Add infos to template.
		const tempEl = $(this.tpl);
		if (logoPath) {
			tempEl.find(".logo").attr("src", logoPath);
		}
		if (changeLog) {
			tempEl.find(".version").html(function () {
				return $(this).html().replace("$VERSION$", changeLog.version);
			});
		}
		this.tpl = tempEl.prop("outerHTML");
	}

	, postRender: function () {
		this.onEvent("onHandshake", this.onHandshake.bind(this));

		this.on(".btnLogin", "click", this.onLoginClick.bind(this));
		this.on(".btnRegister", "click", this.onRegisterClick.bind(this));

		this.find(".extra, .version")
			.appendTo($("<div class=\"uiLoginExtra\"></div>")
				.appendTo(".ui-container"));

		$(".uiLoginExtra").find(".btn").on("click", this.redirect.bind(this));

		$(".news, .version").on("click", this.redirect.bind(this));

		this.find("input")
			.on("keyup", this.onKeyDown.bind(this))
			.eq(0).focus();

		renderer.buildTitleScreen();
	}

	, redirect: function (e) {
		let currentLocation = $(e.currentTarget).attr("location");
		window.open(currentLocation, "_blank");
	}

	, onKeyDown: function (e) {
		if (e.keyCode === 13) {
			this.onLoginClick();
		}
	}
	, onHandshake: function () {
		this.show();
	}

	, onLoginClick: async function () {
		if (this.el.hasClass("disabled")) {
			return;
		}
		this.el.addClass("disabled");

		const res = await client.componentProxy.auth.login({
			username: this.val(".txtUsername")
			, password: this.val(".txtPassword")
		});
		this.onLogin(res);
	}
	, onLogin: function (res) {
		this.el.removeClass("disabled");
		if (res) {
			this.el.find(".message").html(res);
		} else {
			uiFactory.preload();
			$(".uiLoginExtra").remove();
			this.destroy();
		}
	}

	, onRegisterClick: async function () {
		if (this.el.hasClass("disabled")) {
			return;
		}
		this.el.addClass("disabled");

		const res = await client.componentProxy.auth.register({
			username: this.val(".txtUsername")
			, password: this.val(".txtPassword")
		});
		this.onLogin(res);
	}
};
