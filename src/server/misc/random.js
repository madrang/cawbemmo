/* eslint-disable */

var Random =function(a){a=a===void 0?(new Date).getTime():a;this.N=624;this.M=397;this.MATRIX_A=2567483615;this.UPPER_MASK=2147483648;this.LOWER_MASK=2147483647;this.mt=Array(this.N);this.mti=this.N+1;this.init_by_array([a],1)};Random.prototype.init_genrand=function(a){this.mt[0]=a>>>0;for(this.mti=1;this.mti<this.N;this.mti++)a=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30,this.mt[this.mti]=(((a&4294901760)>>>16)*1812433253<<16)+(a&65535)*1812433253+this.mti,this.mt[this.mti]>>>=0};
Random.prototype.init_by_array=function(a,c){var b,f,e;this.init_genrand(19650218);b=1;f=0;for(e=this.N>c?this.N:c;e;e--){var d=this.mt[b-1]^this.mt[b-1]>>>30;this.mt[b]=(this.mt[b]^(((d&4294901760)>>>16)*1664525<<16)+(d&65535)*1664525)+a[f]+f;this.mt[b]>>>=0;b++;f++;b>=this.N&&(this.mt[0]=this.mt[this.N-1],b=1);f>=c&&(f=0)}for(e=this.N-1;e;e--)d=this.mt[b-1]^this.mt[b-1]>>>30,this.mt[b]=(this.mt[b]^(((d&4294901760)>>>16)*1566083941<<16)+(d&65535)*1566083941)-b,this.mt[b]>>>=0,b++,b>=this.N&&(this.mt[0]=
this.mt[this.N-1],b=1);this.mt[0]=2147483648};
Random.prototype.genrand_int32=function(){var a,c=[0,this.MATRIX_A];if(this.mti>=this.N){var b;this.mti==this.N+1&&this.init_genrand(5489);for(b=0;b<this.N-this.M;b++)a=this.mt[b]&this.UPPER_MASK|this.mt[b+1]&this.LOWER_MASK,this.mt[b]=this.mt[b+this.M]^a>>>1^c[a&1];for(;b<this.N-1;b++)a=this.mt[b]&this.UPPER_MASK|this.mt[b+1]&this.LOWER_MASK,this.mt[b]=this.mt[b+(this.M-this.N)]^a>>>1^c[a&1];a=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK;this.mt[this.N-1]=this.mt[this.M-1]^a>>>1^
c[a&1];this.mti=0}a=this.mt[this.mti++];a^=a>>>11;a^=a<<7&2636928640;a^=a<<15&4022730752;a^=a>>>18;return a>>>0};Random.prototype.genrand_int31=function(){return this.genrand_int32()>>>1};Random.prototype.genrand_real1=function(){return this.genrand_int32()*(1/4294967295)};Random.prototype.random=function(){if(this.pythonCompatibility)this.skip&&this.genrand_int32(),this.skip=!0;return this.genrand_int32()*(1/4294967296)};
Random.prototype.genrand_real3=function(){return(this.genrand_int32()+0.5)*(1/4294967296)};Random.prototype.genrand_res53=function(){var a=this.genrand_int32()>>>5,c=this.genrand_int32()>>>6;return(a*67108864+c)*1.1102230246251565E-16};Random.prototype.LOG4=Math.log(4);Random.prototype.SG_MAGICCONST=1+Math.log(4.5);Random.prototype.exponential=function(a){var c=this.random();return-Math.log(c)/a};
Random.prototype.gamma=function(a,c){if(a>1)for(var b=Math.sqrt(2*a-1),f=a-this.LOG4,e=a+b;;){var d=this.random();if(!(d<1.0E-7||g>0.9999999)){var j=1-this.random(),i=Math.log(d/(1-d))/b,h=a*Math.exp(i),d=d*d*j,i=f+e*i-h;if(i+this.SG_MAGICCONST-4.5*d>=0||i>=Math.log(d))return h*c}}else if(a==1){for(var g=this.random();g<=1.0E-7;)g=this.random();return-Math.log(g)*c}else{for(;;)if(g=this.random(),h=(Math.E+a)/Math.E,g*=h,h=g<=1?Math.pow(g,1/a):-Math.log((h-g)/a),d=this.random(),g>1){if(d<=Math.pow(h,
a-1))break}else if(d<=Math.exp(-h))break;return h*c}};Random.prototype.normal=function(a,c){var b=this.lastNormal;this.lastNormal=NaN;if(!b){var f=this.random()*2*Math.PI,e=Math.sqrt(-2*Math.log(1-this.random())),b=Math.cos(f)*e;this.lastNormal=Math.sin(f)*e}return a+b*c};Random.prototype.pareto=function(a){var c=this.random();return 1/Math.pow(1-c,1/a)};
Random.prototype.triangular=function(a,c,b){var f=(b-a)/(c-a),e=this.random();return e<=f?a+Math.sqrt(e*(c-a)*(b-a)):c-Math.sqrt((1-e)*(c-a)*(c-b))};Random.prototype.uniform=function(a,c){return a+this.random()*(c-a)};Random.prototype.weibull=function(a,c){var b=1-this.random();return a*Math.pow(-Math.log(b),1/c)};

global.random = new Random();
_.assign(random, {
	norm: function(low, high) {
		var mid = low + ((high - low) / 2);
		var range = mid - low;

		var roll = this.normal(0, 0.35);
		if (roll < -1)
			roll = -1;
		else if (roll > 1)
			roll = 1;

		var result = (mid + (roll * range));
		return result;
	},

	expNorm: function(low, high) {
		var roll = Math.abs(random.norm(0, 100) - 50) / 50;
		const result = low + ((high - low) * roll);

		return result;
	}
});
