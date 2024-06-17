define([
	"particles"
	, "js/rendering/particleDefaults"
	, "js/rendering/shaders/outline"
], function (
	pixiParticles,
	particleDefaults,
	shaderOutline
) {
	return {
		renderer: null
		, stage: null

		, emitters: []

		, lastTick: null

		, init: function (options) {
			this.r = options.r;
			this.renderer = options.renderer;
			this.stage = options.stage;
			this.lastTick = Date.now();
		}

		, buildEmitter: function (config) {
			const obj = config.obj;
			delete config.obj;
			const options = $.extend(true, {}, particleDefaults, config);
			//FIXME remove upgradeConfig after updating the particle configuration.
			const newCfg = PIXI.particles.upgradeConfig(options, ["images/particles.png"]);
			console.warn("Legacy Emitter config updated from %o to %o", options, newCfg);
			const emitter = new PIXI.particles.Emitter(this.stage, newCfg);
			emitter.obj = obj;
			emitter.emit = true;
			emitter.particleEngine = this;
			this.emitters.push(emitter);
			return emitter;
		}

		, destroyEmitter: function (emitter) {
			emitter.emit = false;
		}

		, update: function () {
			const renderer = this.r;
			const now = Date.now();
			const emitters = this.emitters;
			let eLen = emitters.length;
			for (let i = 0; i < eLen; i++) {
				const e = emitters[i];
				let visible = null;
				let destroy = ((!e.emit) && (e.obj.destroyed));
				if (destroy) {
					if (e.particleCount > 0) {
						visible = renderer.isVisible(e.spawnPos.x, e.spawnPos.y);
						if (visible) {
							destroy = false;
						}
					}
				}
				if (destroy) {
					emitters.splice(i, 1);
					e.destroy();
					i--;
					eLen--;
					continue;
				}
				if (visible === null) {
					visible = renderer.isVisible(e.spawnPos.x, e.spawnPos.y);
				}
				if (!visible) {
					continue;
				}
				let r;
				try {
					//FIXME, Negative color crash in pixi.particles.js when tab is hidden for too long.
					r = e.update((now - this.lastTick) * 0.001);
				} catch (error) {
					console.error(error);
				}
				if (r) {
					console.log("Particles", r);
					r.forEach(function (rr) {
						if (e.blendMode === "overlay") {
							rr.pluginName = "picture";
						}
					}, this);
				}
			}
			this.lastTick = now;
		}
	};
});
