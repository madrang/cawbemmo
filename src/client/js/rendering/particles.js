import { Assets, ParticleContainer } from "pixi.js";
import { Emitter } from "/js/dependencies/pixi-particle-system/index.js";
import particleDefaults from "./particleDefaults.js";

const PARTICLE_TEXTURE_URL = "/images/particle.png";

export default {
	renderer: null
	, stage: null

	, texture: null

	, emitters: []

	, init: async function (options) {
		this.r = options.r;
		this.renderer = options.renderer;
		this.stage = options.stage;

		this.texture = await Assets.load(PARTICLE_TEXTURE_URL);
	}

	// Build the ParticleContainer used as the particle layer. v8's
	// ParticleContainer requires a texture at construction time; the particle
	// image is loaded in init() (called before this), so this.texture is ready.
	, createContainer: function () {
		return new ParticleContainer({
			texture: this.texture
		});
	}

	, buildEmitter: function (config) {
		const obj = config.obj;
		delete config.obj;
		const pos = config.pos;
		delete config.pos;
		// blendMode is not a behavior in pixi-particle-system, and v8's
		// ParticleContainer exposes no blend-mode setting, so the value is
		// dropped (particles render with normal blending). It is still parsed
		// out here so the library doesn't receive an unknown config field.
		delete config.blendMode;

		const options = _.assignWith("particles", {}, particleDefaults(this.texture), config);
		//console.log("Particles emitter created", options);
		const emitter = new Emitter(this.stage, options);
		emitter.obj = obj;
		emitter.particleEngine = this;
		if (pos) {
			emitter.spawnBehavior.origin = pos;
		}
		emitter.play();
		this.emitters.push(emitter);
		return emitter;
	}

	, destroyEmitter: function (emitter) {
		// stop(instant=true) removes existing particles immediately.
		emitter.stop(true);

		const i = this.emitters.indexOf(emitter);
		if (i >= 0) {
			this.emitters.splice(i, 1);
		}
	}
};
