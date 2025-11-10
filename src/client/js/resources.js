import events from "/js/system/events.js";
import globals from "/js/system/globals.js";

export default {
	sprites: {}

	, loadSprite: function (s) {
		return new Promise((resolve, reject) => {
			const spriteSource = s.includes(".png") ? s : `images/${s}.png`;

			const sprite = new Image();
			this.sprites[s] = sprite;
			sprite.onload = resolve;
			sprite.onerror = () => {
				const errMsg = `❌ Failed to load image: ${s}`;
				_.log.resources.error(errMsg);
				reject(new Error(errMsg));
			};
			sprite.src = spriteSource;
		});
	}

	, init: async function () {
		const { clientConfig: { resourceList, textureList } } = globals;

		const fullList = [ ...resourceList, ...textureList ];
		let loadedCount = 0;
		return Promise.all(fullList.map((s) => {
			return this.loadSprite(s).then(() => {
				loadedCount++;
				events.emit("loaderProgress", {
					type: "resources"
					, progress: loadedCount / fullList.length
				});
			});
		}));
	}
};
