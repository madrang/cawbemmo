define([
	"particles"
	, "js/rendering/particleDefaults"
	, "js/rendering/shaders/outline"
], function (
	pixiParticles,
	particleDefaults,
	//TODO Fix shader outline.
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
			const options = _.assignWith("particles", {}, particleDefaults, config);
			//console.log("Particles emitter created", options);
			const emitter = new PIXI.particles.Emitter(this.stage, options);
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
			for (let i = emitters.length - 1; i >= 0; --i) {
				const e = emitters[i];
				let visible = null;
				let destroy = (!e.emit && e.obj.destroyed);
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
					continue;
				}
				if (visible === null) {
					visible = renderer.isVisible(e.spawnPos.x, e.spawnPos.y);
				}
				if (!visible) {
					continue;
				}
				try {
					//FIXME - Negative color crash in pixi.particles.js when tab is hidden for too long.
					e.update((now - this.lastTick) * 0.001);
				} catch (error) {
					console.error(error);
				}
			}
			this.lastTick = now;
		}
	};
});
