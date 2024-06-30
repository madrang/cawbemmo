const fileLister = require("../misc/fileLister");
const events = require("../misc/events");

const knownModuleSet = new Set();

module.exports = {
	mods: []

	, init: async function ({ logger = _.log.mods } = {}) {
		this.logger = logger;
		//Load all mods
		const modList = fileLister.getFolderList("mods");
		const loadList = modList.map((modName) => {
			if(!knownModuleSet.has(modName)) {
				knownModuleSet.add(modName);
				this.logger.debug("Loading module '%s'", modName);
			}
			const path = `../mods/${modName}/index`;
			const mod = _.safeRequire(module, path);
			if (!mod) {
				return;
			}
			return {
				id: mod.id ? mod.id : modName.replace("iwd-", "")
				, folderName: modName
				, path
				, mod
			};
		}).filter((m) => Boolean(m));
		// Enable mods
		while (loadList.length > 0) {
			const m = loadList.shift();
			const { id, folderName, mod } = m;
			const { dependsOn = [] } = mod;
			// Check if all dependencies are loaded.
			const wait = dependsOn.some((d) => loadList.some((l) => l.id === d));
			if (wait) {
				loadList.push(m);
				continue;
			}
			await this.onGetMod(folderName, mod);
			this.mods.push(mod);
		}
	}

	, onGetMod: async function (name, mod) {
		if (mod.disabled) {
			return;
		}

		const isMapThread = Boolean(global.instancer);
		mod.isMapThread = isMapThread;

		mod.events = events;
		mod.folderName = "server/mods/" + name;
		mod.relativeFolderName = "mods/" + name;

		let list = (mod.extraScripts || []);
		let lLen = list.length;

		for (let i = 0; i < lLen; i++) {
			const extra = _.safeRequire(module, `../mods/${name}/${list[i]}`, this.logger);
			if (extra) {
				this.onGetExtra(name, mod, extra);
			}
		}

		if (typeof mod.init === "function") {
			await mod.init();
		}

		if (isMapThread && typeof mod.initMapThread === "function") {
			await mod.initMapThread();
		} else if (!isMapThread && typeof mod.initMainThread === "function") {
			await mod.initMainThread();
		}
	}

	, onGetExtra: function (name, mod, extra) {
		extra.folderName = "server/mods/" + name;
	}

	, tick: function () {
		this.mods.forEach((m) => {
			if (m.tick) {
				m.tick();
			}
		});
	}
};
