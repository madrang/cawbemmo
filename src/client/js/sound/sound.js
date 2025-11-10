import "/js/dependencies/howler.core.min.js";
import config from "/js/config.js";
import events from "/js/system/events.js";
import globals from "/js/system/globals.js";
import physics from "/js/misc/physics.js";

const MASTER_VOLUME = 0.3;
const MIN_DISTANCE = 10;

let soundVolume = config.soundVolume;
let musicVolume = config.musicVolume;

const globalScopes = ["ui"];
const minDistance = 10;
const fadeDuration = 1800;

window.Howler.volume(MASTER_VOLUME);

export default {
	sounds: []

	, muted: false

	, currentMusic: null

	, init: function () {
		events.on("onToggleAudio", this.onToggleAudio.bind(this));
		events.on("onPlaySound", this.playSound.bind(this));
		events.on("onPlaySoundAtPosition", this.onPlaySoundAtPosition.bind(this));
		events.on("onManipulateVolume", this.onManipulateVolume.bind(this));

		const { clientConfig: { sounds: loadSounds } } = globals;
		let loadCount = 0;
		let totalToLoad = 0;
		for (const [ scope, soundList ] of Object.entries(loadSounds)) {
			for (const soundInfo of soundList) {
				const promiseSrc = new _.PromiseSource();
				const newSound = Object.assign({
					scope
					, autoLoad: { resolve: promiseSrc.resolve, reject: promiseSrc.reject }
				}, soundInfo);
				totalToLoad++;
				this.addSound(newSound);
				promiseSrc.promise.then(() => {
					loadCount++;
					events.emit("loaderProgress", {
						type: "sounds"
						, progress: totalToLoad ? loadCount / totalToLoad : 1
					});
				});
			}
		}
		this.onToggleAudio(config.playAudio);
	}

	//Fired when a character rezones
	// 'newScope' is the new zone name
	, unload: function (newScope) {
		const { sounds } = this;

		for (let i = 0; i < sounds.length; i++) {
			const { scope, sound } = sounds[i];

			if (!globalScopes.includes(scope) && scope !== newScope) {
				if (sound) {
					sound.unload();
				}
				sounds.splice(i, 1);
				i--;
			}
		}
	}

	, onPlaySoundAtPosition: function ({ position: { x, y }, file, volume }) {
		const { player: { x: playerX, y: playerY } } = window;
		const dx = Math.abs(x - playerX);
		const dy = Math.abs(y - playerY);
		const distance = Math.max(dx, dy);

		const useVolume = volume * (1 - (Math.pow(distance, 2) / Math.pow(minDistance, 2)));

		//eslint-disable-next-line no-undef, no-unused-vars
		const sound = new Howl({
			src: [file]
			, volume: useVolume
			, loop: false
			, autoplay: true
			, html5: false
		});
	}

	, playSound: function (soundName) {
		const soundEntry = this.sounds.find((s) => s.name === soundName);
		if (!soundEntry) {
			return;
		}

		const { sound } = soundEntry;

		sound.volume(soundVolume / 100);
		sound.play();
	}

	, playSoundHelper: function (soundEntry, volume) {
		const { sound } = soundEntry;

		if (!sound) {
			const { file, loop } = soundEntry;
			soundEntry.sound = this.loadSound(file, loop, true, volume);
			return;
		}
		soundEntry.volume = volume;
		volume *= (soundVolume / 100);

		if (sound.playing()) {
			if (sound.volume() === volume) {
				return;
			}
			sound.volume(volume);
		} else {
			sound.volume(volume);
			sound.play();
		}
	}

	, playMusicHelper: function (soundEntry) {
		const { sound } = soundEntry;
		if (!sound) {
			const { file, loop } = soundEntry;
			soundEntry.volume = musicVolume;
			soundEntry.sound = this.loadSound(file, loop, true, musicVolume / 100);
			return;
		}
		if (!sound.playing()) {
			soundEntry.volume = 0;
			sound.volume(0);
			sound.play();
		}
		if (this.currentMusic === soundEntry && sound.volume() === musicVolume / 100) {
			return;
		}
		this.currentMusic = soundEntry;
		sound.fade(sound.volume(), (musicVolume / 100), fadeDuration);
	}

	, stopSoundHelper: function (soundEntry) {
		const { sound, music } = soundEntry;
		if (!sound || !sound.playing()) {
			return;
		}
		if (music) {
			sound.fade(sound.volume(), 0, fadeDuration);
		} else {
			sound.stop();
			sound.volume(0);
		}
	}

	, updateSounds: function (playerX, playerY) {
		this.sounds.forEach((s) => {
			const { x, y, area, music, scope } = s;
			if (music || scope === "ui") {
				return;
			}
			let distance = 0;
			if (!area) {
				let dx = Math.abs(x - playerX);
				let dy = Math.abs(y - playerY);
				distance = Math.max(dx, dy);
			} else if (!physics.isInPolygon(playerX, playerY, area)) {
				distance = physics.distanceToPolygon([playerX, playerY], area);
			}
			if (distance > minDistance) {
				this.stopSoundHelper(s);
				return;
			}
			//Exponential fall-off
			const volume = s.maxVolume * (1 - (Math.pow(distance, 2) / Math.pow(minDistance, 2)));
			this.playSoundHelper(s, volume);
		});
	}

	, updateMusic: function (playerX, playerY) {
		const sounds = this.sounds;

		const areaMusic = sounds.filter((s) => s.music && s.area);

		//All music that should be playing because we're in the correct polygon
		const playMusic = areaMusic.filter((s) => physics.isInPolygon(playerX, playerY, s.area));

		//All music that should stop playing because we're in the incorrect polygon
		const stopMusic = areaMusic.filter((s) => s.sound && s.sound.playing() && !playMusic.some((m) => m === s));

		//Stop or start defaultMusic, depending on whether anything else was found
		const defaultMusic = sounds.filter((a) => a.defaultMusic);
		if (defaultMusic) {
			if (!playMusic.length) {
				defaultMusic.forEach((m) => this.playMusicHelper(m));
			} else {
				defaultMusic.forEach((m) => this.stopSoundHelper(m));
			}
		}

		//If there's a music entry in both 'play' and 'stop' that shares a fileName, we'll just ignore it. This happens when you
		// move to a building interior, for example. Unfortunately, we can't have different volume settings for these kinds of entries.
		// The one that starts playing first will get priority
		const filesPlaying = [...playMusic.map((p) => p.file), ...stopMusic.map((p) => p.file)];
		playMusic.spliceWhere((p) => filesPlaying.filter((f) => f === p.file).length > 1);
		stopMusic.spliceWhere((p) => filesPlaying.filter((f) => f === p.file).length > 1);

		stopMusic.forEach((m) => this.stopSoundHelper(m));
		playMusic.forEach((m) => this.playMusicHelper(m));
	}

	, update: function (playerX, playerY) {
		this.updateSounds(playerX, playerY);
		this.updateMusic(playerX, playerY);
	}

	, addSound: function (
		{ name: soundName, scope, file, volume = 1, x, y, w, h, area, music, defaultMusic, loop, autoLoad }
	) {
		if (this.sounds.some((s) => s.file === file)) {
			if (window.player?.x !== undefined) {
				this.update(window.player.x, window.player.y);
			}
			return;
		}
		if (!area && w) {
			area = [
				[x, y]
				, [x + w, y]
				, [x + w, y + h]
				, [x, y + h]
			];
		}
		let sound = null;
		if (typeof autoLoad === "object") {
			sound = this.loadSound(file, loop, false, music ? 0 : volume, autoLoad);
		} else if (autoLoad) {
			sound = this.loadSound(file, loop, false, music ? 0 : volume);
		}
		if (music) {
			volume = 0;
		}
		const soundEntry = {
			name: soundName
			, sound
			, scope
			, file
			, loop
			, x
			, y
			, volume
			, maxVolume: volume
			, area
			, music
			, defaultMusic
		};
		this.sounds.push(soundEntry);

		if (window.player?.x !== undefined) {
			this.update(window.player.x, window.player.y);
		}
		return soundEntry;
	}

	, loadSound: function (file, loop = false, autoplay = false, volume = 1, onLoad = undefined) {
		//eslint-disable-next-line no-undef
		const sound = new Howl({
			src: [file]
			, volume
			, loop
			, autoplay
			, html5: loop
		});
		if (typeof onLoad === "function") {
			sound.once("load", onLoad);
		} else if (typeof onLoad === "object") {
			sound.once("load", onLoad.resolve);
			sound.once("loaderror", onLoad.reject);
		}
		return sound;
	}

	, onToggleAudio: function (isAudioOn) {
		this.muted = !isAudioOn;
		this.sounds.forEach((s) => {
			if (!s.sound) {
				return;
			}
			s.sound.mute(this.muted);
		});
		if (!window.player) {
			return;
		}
		const { player: { x, y } } = window;
		this.update(x, y);
	}

	, onManipulateVolume: function ({ soundType, delta }) {
		if (soundType === "sound") {
			soundVolume = Math.max(0, Math.min(100, soundVolume + delta));
		} else if (soundType === "music") {
			musicVolume = Math.max(0, Math.min(100, musicVolume + delta));
		}
		const volume = soundType === "sound" ? soundVolume : musicVolume;

		events.emit("onVolumeChange", {
			soundType
			, volume
		});

		const { player: { x, y } } = window;
		this.update(x, y);
	}

	, destroySoundEntry: function (soundEntry) {
		this.sounds.spliceWhere((s) => s === soundEntry);
	}
};
