const fileLister = require("../misc/fileLister");
const events = require("../misc/events");

module.exports = {
	mods: []

	, init: async function () {
		//Load all mods
		const modList = fileLister.getFolderList("mods");
		const loadList = modList.map((modName) => {
			const path = `../mods/${modName}/index`;
			const mod = require(path);
			const id = mod.id ? mod.id : modName.replace("iwd-", "");
			return {
				id
				, folderName: modName
				, path
				, mod
			};
		});
		// Enable mods
		while (loadList.length) {
			for (const m of loadList) {
				const { id, folderName, mod } = m;
				const { dependsOn = [] } = mod;
				// Check if all dependencies are loaded.
				const wait = dependsOn.some((d) => loadList.some((l) => l.id === d));
				if (wait) {
					continue;
				}
				await this.onGetMod(folderName, mod);
				this.mods.push(mod);
				// Remove from loadList.
				loadList.spliceWhere((l) => l.id === id);
			}
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
			const extra = require(`../mods/${name}/${list[i]}`);
			this.onGetExtra(name, mod, extra);
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
