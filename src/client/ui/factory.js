define([
	"ui/uiBase"
	, "js/system/events"
	, "js/system/client"
	, "js/system/globals"
	, "js/system/browserStorage"
], function (
	uiBase
	, events
	, client
	, globals
	, browserStorage
) {
	const setUiTypes = (list) => {
		list.forEach((l, i) => {
			if (typeof l === "string") {
				// Some UIs are strings. In these cases,
				// the path should default to the client/ui/templates folder
				list[i] = {
					type: l,
					path: `ui/templates/${l}`,
					autoLoadOnPlay: true
				};
			} else if (!l.type) {
				l.type = l.path.split("/").pop();
			} else if (!l.path) {
				l.path = `ui/templates/${l.type}`;
			}
		});
	};

	const tosAcceptanceValid = () => {
		const acceptedVersion = browserStorage.get("tos_accepted_version");
		const currentVersion = globals.clientConfig.tos.version;
		return acceptedVersion === currentVersion;
	};

	const hasNewContent = () => {
		const logVersion = browserStorage.get("changelog_version");
		const currentVersion = globals.clientConfig.changeLog.version;
		return logVersion !== currentVersion;
	};

	return {
		uis: []
		, ingameUisBuilt: false

		, init: function () {
			events.on("onBuildIngameUis", this.onBuildIngameUis.bind(this));
			events.on("onUiKeyDown", this.onUiKeyDown.bind(this));
			events.on("onResize", this.onResize.bind(this));

			setUiTypes(globals.clientConfig.uiLoginList);
			setUiTypes(globals.clientConfig.uiList);

			for (const u of globals.clientConfig.uiLoginList) {
				this.buildFromConfig(u);
			}
		}

		, onBuildIngameUis: async function () {
			if (!this.ingameUisBuilt) {
				events.clearQueue();

				await Promise.all(
					globals.clientConfig.uiList
						.filter(u => u.autoLoadOnPlay !== false)
						.map(u => {
							return new Promise(res => {
								const doneCheck = () => {
									const isDone = this.uis.some(ui => ui.type === u.type);
									if (isDone) {
										res();

										return;
									}

									setTimeout(doneCheck, 100);
								};

								this.buildFromConfig(u);

								doneCheck();
							});
						})
				);

				this.ingameUisBuilt = true;
			}

			client.request({
				threadModule: "instancer"
				, method: "clientAck"
				, data: {}
			});
		}

		, build: function (type) {
			const config = globals.clientConfig.uiList.find(u => u.type === type);
			if (!config) {
				throw new Error(`Can't build ${type}! Missing configuration.`);
			}
			return this.buildFromConfig(config);
		}

		, buildFromConfig: async function (config) {
			const { type, path } = config;

			const className = "ui" + type.capitalize();
			const el = $("." + className);
			if (el.length > 0) {
				return;
			}
			const fullPath = `${path}/${type}`;
			const template = await new Promise((res) => require([fullPath], res));
			const ui = _.assign({ type }, uiBase, template);
			requestAnimationFrame(this.renderUi.bind(this, ui));
			return ui;
		}

		, renderUi: function (ui) {
			ui.render();
			ui.el.data("ui", ui);
			this.uis.push(ui);
		}

		, onResize: function () {
			for (const ui of this.uis) {
				if (ui.centered) {
					ui.center();
				} else if (ui.centeredX || ui.centeredY) {
					ui.center(ui.centeredX, ui.centeredY);
				}
			}
		}

		, onUiKeyDown: function (keyEvent) {
			if (keyEvent.key === "esc") {
				for (const u of this.uis) {
					if (!u.modal || !u.shown) {
						continue;
					}
					keyEvent.consumed = true;
					u.toggle();
				}
				$(".uiOverlay").hide();
				events.emit("onHideContextMenu");
			} else if (["o", "j", "h", "i"].indexOf(keyEvent.key) > -1) {
				$(".uiOverlay").hide();
			}
		}

		, preload: function () {
			require([
				"death"
				, "dialogue"
				, "equipment"
				, "events"
				, "hud"
				, "inventory"
				, "overlay"
				, "passives"
				, "quests"
				, "reputation"
				, "stash"
			].map((m) => `ui/templates/${m}/${m}`), this.afterPreload.bind(this));
		}

		, afterPreload: function () {
			if (!tosAcceptanceValid()) {
				this.build("terms");
				return;
			}
			if (hasNewContent()) {
				this.build("changeLog");
				return;
			}
			this.build("characters");
		}

		, update: function () {
			let uis = this.uis;
			let uLen = uis.length;
			for (let i = 0; i < uLen; i++) {
				let u = uis[i];
				if (u.update) {
					u.update();
				}
			}
		}

		, exitGame: function () {
			$("[class^=\"ui\"]:not(.ui-container)").toArray().forEach((el) => {
				let ui = $(el).data("ui");
				if (ui && ui.destroy) {
					ui.destroy();
				}
			});

			this.ingameUisBuilt = false;
		}

		, getUi: function (type) {
			return this.uis.find((u) => u.type === type);
		}
	};
});
