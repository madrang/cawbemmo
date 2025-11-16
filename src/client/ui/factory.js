import uiBase from "/ui/uiBase.js";
import events from "/js/system/events.js";
import client from "/js/system/client.js";
import globals from "/js/system/globals.js";
import browserStorage from "/js/system/browserStorage.js";

const setUiTypes = (list) => {
	list.forEach((l, i) => {
		if (typeof l === "string") {
			// Some UIs are strings. In these cases,
			// the path should default to the client/ui/templates folder
			list[i] = {
				type: l
				, path: `/ui/templates/${l}`
				, load: true
			};
		} else if (!l.type) {
			l.type = l.path.split("/").pop();
		} else if (!l.path) {
			l.path = `/ui/templates/${l.type}`;
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

export default {
	uis: []
	, ingameUisBuilt: false

	, init: function () {
		events.on("onBuildIngameUis", this.onBuildIngameUis.bind(this));
		events.on("onUiKeyDown", this.onUiKeyDown.bind(this));
		events.on("onUiAction", this.onUiAction.bind(this));
		events.on("onResize", this.onResize.bind(this));
		events.on("onDestroyedUi", this.onDestroyedUi.bind(this));

		setUiTypes(globals.clientConfig.uiLoginList);
		setUiTypes(globals.clientConfig.uiList);

		for (const uiConfig of globals.clientConfig.uiLoginList) {
			if (!uiConfig.load) {
				continue;
			}
			if (uiConfig.preload) {
				_.log.ui.factory.preload.debug("Preloading UI module %o", uiConfig);
				Promise.resolve(import(`${uiConfig.path}/${uiConfig.type}.js`)).catch(_.log.ui.factory.preload.error);
			} else {
				this.buildFromConfig(uiConfig);
			}
		}
	}

	, onDestroyedUi: function (ui) {
		if (!ui || !ui.type) {
			_.log.factory.onDestroyedUi.error("Invalid UI reference: %o", this);
			return;
		}
		_.log.factory.trace("Cleaning destroyed UI %o", this);
		this.uis.spliceWhere((u) => u.type === ui.type);
	}

	, onBuildIngameUis: async function () {
		if (!this.ingameUisBuilt) {
			events.clearQueue();
			await Promise.all(
				globals.clientConfig.uiList
					.filter((u) => u.load)
					.map((u) => this.buildFromConfig(u))
			);
			this.ingameUisBuilt = true;
		}
		client.request({
			threadModule: "instancer"
			, method: "clientAck"
			, data: {}
		});
	}

	, build: function (type, options) {
		let config = globals.clientConfig.uiList.find((u) => u.type === type);
		if (!config) {
			config = globals.clientConfig.uiLoginList.find((u) => u.type === type);
		}
		if (!config) {
			throw new Error(`Can't build ${type}! Missing configuration.`);
		}
		return this.buildFromConfig(config, options);
	}

	, buildFromConfig: async function (config, options = {}) {
		const { type, path } = config;

		let ui = this.getUi(type);
		if (ui) {
			_.log.ui.factory.buildFromConfig.warn("UI module '%s' already loaded.", type);
			return ui;
		}

		_.log.ui.factory.buildFromConfig.debug("Loading UI module '%s'.", type);
		const template = await import(`${path}/${type}.js`);
		ui = _.assign({ type }, uiBase, template.default, options);
		const renderUI = this.renderUi.bind(this, ui);
		await new Promise(
			(res) => requestAnimationFrame(
				(timeStamp) => {
					renderUI();
					res();
				}
			)
		);
		return ui;
	}

	, renderUi: function (ui) {
		ui.render();
		ui.el.data("ui", ui);
		_.log.factory.debug("Element %o linked to UI %o", ui.el, ui);
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

	, onUiAction: function (actionEvent) {
		if (actionEvent.action === "mainmenu") {
			for (const u of this.uis) {
				if (!u.modal || !u.shown) {
					continue;
				}
				actionEvent.consumed = true;
				u.toggle();
			}
			$(".uiOverlay").hide();
			events.emit("onHideContextMenu");
		}
	}

	, onUiKeyDown: function (keyEvent) {
		if (["o", "j", "h", "i"].indexOf(keyEvent.key) > -1) {
			$(".uiOverlay").hide();
		}
	}

	, preload: function () {
		const loadingPromises = [];
		for (const moduleInfo of globals.clientConfig.uiList) {
			if (moduleInfo.preload === false) {
				continue;
			}
			_.log.ui.factory.preload.debug("Preloading UI module %o", moduleInfo);
			loadingPromises.push(import(`${moduleInfo.path}/${moduleInfo.type}.js`));
		}
		Promise.all(loadingPromises).then(this.afterPreload.bind(this), _.log.ui.factory.preload.error);
	}

	, afterPreload: function () {
		if (!tosAcceptanceValid()) {
			return this.build("terms");
		}
		if (hasNewContent()) {
			return this.build("changeLog");
		}
		return this.build("characters");
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
