let roles = require('../config/roles');

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

		if (obj.zoneName === this.toZone) {
			obj.x = this.toPos.x;
			obj.y = this.toPos.y;

			const syncO = this.obj.syncer.o;
			syncO.x = obj.x;
			syncO.y = obj.y;

			process.send({
				method: 'rezone',
				id: obj.serverId,
				args: {
					obj: simpleObj,
					newZone: this.toZone
				}
			});

			return;
		}

		obj.fireEvent('beforeRezone');

		obj.destroyed = true;

		await obj.auth.doSave();

		const simpleObj = obj.getSimple(true, false, true);

		const { toPos, toRelativePos } = this;
		if (toPos) {
			simpleObj.x = this.toPos.x;
			simpleObj.y = this.toPos.y;
		} else if (toRelativePos) {
			simpleObj.x = this.obj.x + toRelativePos.x;
			simpleObj.y = this.obj.y + toRelativePos.y;
		}

		process.send({
			method: 'rezone',
			id: obj.serverId,
			args: {
				obj: simpleObj,
				newZone: this.toZone
			}
		});
	}
};
