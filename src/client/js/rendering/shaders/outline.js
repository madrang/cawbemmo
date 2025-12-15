export const vertex = `
	attribute vec2 aVertexPosition;

	uniform mat3 projectionMatrix;

	varying vec2 vTextureCoord;

	uniform vec4 inputSize;
	uniform vec4 outputFrame;

	vec4 filterVertexPosition( void )
	{
		vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

		return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
	}

	vec2 filterTextureCoord( void )
	{
		return aVertexPosition * (outputFrame.zw * inputSize.zw);
	}

	void main(void)
	{
		gl_Position = filterVertexPosition();
		vTextureCoord = filterTextureCoord();
	}
`;

export const fragment = `
	varying vec2 vTextureCoord;
	uniform sampler2D uSampler;
	uniform vec4 filterClamp;

	uniform float uAlpha;
	uniform vec2 uThickness;
	uniform vec4 uColor;
	uniform bool uKnockout;

	const float DOUBLE_PI = 2. * 3.14159265358979323846264;
	const float ANGLE_STEP = $angleStep$;

	float outlineMaxAlphaAtPos(vec2 pos) {
		if (uThickness.x == 0. || uThickness.y == 0.) {
			return 0.;
		}

		vec4 displacedColor;
		vec2 displacedPos;
		float maxAlpha = 0.;

		for (float angle = 0.; angle <= DOUBLE_PI; angle += ANGLE_STEP) {
			displacedPos.x = vTextureCoord.x + uThickness.x * cos(angle);
			displacedPos.y = vTextureCoord.y + uThickness.y * sin(angle);
			displacedColor = texture2D(uSampler, clamp(displacedPos, filterClamp.xy, filterClamp.zw));
			maxAlpha = max(maxAlpha, displacedColor.a);
		}

		return maxAlpha;
	}

	void main(void) {
		vec4 sourceColor = texture2D(uSampler, vTextureCoord);
		vec4 contentColor = sourceColor * float(!uKnockout);
		float outlineAlpha = uAlpha * outlineMaxAlphaAtPos(vTextureCoord.xy) * (1.-sourceColor.a);
		vec4 outlineColor = vec4(vec3(uColor) * outlineAlpha, outlineAlpha);
		gl_FragColor = contentColor + outlineColor;
	}
`;

export default class OutlineFilter extends PIXI.Filter {
	constructor ({ thickness = 5, color = 0xFFFFFF, quality = 0.1, alpha = 1.0, knockout = false }) {
		const angleStep = Math.PI / 2;

		super(vertex, fragment.replace("$angleStep$", angleStep));

		this.uniforms.uThickness = new Float32Array([thickness, thickness]);
		this.uniforms.uColor = new Float32Array([1, 1, 1, 1]);
		this.uniforms.uAlpha = alpha;
		this.uniforms.uKnockout = knockout;

		const rgbColor = PIXI.utils.hex2rgb(color);
		this.uniforms.uColor = PIXI.utils.hex2rgb(rgbColor, this.uniforms.uColor);

		Object.assign(this, { thickness, color, quality, alpha, knockout });
	}

	apply (filterManager, input, output, clear) {
		this.uniforms.uThickness[0] = this.thickness / input._frame.width;
		this.uniforms.uThickness[1] = this.thickness / input._frame.height;
		this.uniforms.uAlpha = this.alpha;
		this.uniforms.uKnockout = this.knockout;
		this.uniforms.uColor = PIXI.utils.hex2rgb(this.color, this.uniforms.uColor);

		filterManager.applyFilter(this, input, output, clear);
	}

	get alpha () {
		return this._alpha;
	}
	set alpha (value) {
		this._alpha = value;
	}

	get color () {
		return PIXI.utils.rgb2hex(this.uniforms.uColor);
	}
	set color (value) {
		PIXI.utils.hex2rgb(value, this.uniforms.uColor);
	}

	get knockout () {
		return this._knockout;
	}
	set knockout (value) {
		this._knockout = value;
	}

	get thickness () {
		return this._thickness;
	}
	set thickness (value) {
		this._thickness = value;
		this.padding = value;
	}
}
