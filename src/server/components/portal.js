const roles = require('../config/roles');

const sendObjToZone = require('./portal/sendObjToZone');

module.exports = {
	type: 'portal',

	toZone: null,
	toPos: null,
	toRelativePos: null,

	patronLevel: 0,

	init: function (blueprint) {
		this.toPos = blueprint.pos;
		this.toRelativePos = blueprint.toRelativePos;
		this.toZone = blueprint.zone;
		this.patronLevel = ~~blueprint.patron;
	},

	collisionEnter: async function (obj) {
		if (!obj.player)
			return;
		else if (this.patronLevel) {
			if (!roles.isRoleLevel(obj, this.patronLevel, 'enter this area'))
				return;
		}

		const { toZone: zoneName, toPos, toRelativePos } = this;

		await sendObjToZone({
			obj,
			invokingObj: this,
			zoneName,
			toPos,
			toRelativePos
		});
	}
};
