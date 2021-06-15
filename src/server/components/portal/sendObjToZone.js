const sendObjToZone = async ({ obj, invokingObj, zoneName, toPos, toRelativePos }) => {
	const { serverId, instance: { physics, syncer: globalSyncer } } = obj;

	globalSyncer.flushForTarget(serverId);

	if (obj.zoneName === zoneName) {
		physics.removeObject(obj, obj.x, obj.y);

		if (toRelativePos) {
			toPos = {
				x: invokingObj.obj.x + toRelativePos.x,
				y: invokingObj.obj.y + toRelativePos.y
			};
		}

		obj.x = toPos.x;
		obj.y = toPos.y;

		physics.addObject(obj, obj.x, obj.y);

		globalSyncer.queue('onRespawn', {
			x: obj.x,
			y: obj.y
		}, [obj.serverId]);

		return;
	}

	obj.fireEvent('beforeRezone');

	obj.destroyed = true;

	await obj.auth.doSave();

	const simpleObj = obj.getSimple(true, false, true);

	if (toPos) {
		simpleObj.x = toPos.x;
		simpleObj.y = toPos.y;
	} else if (toRelativePos) {
		simpleObj.x = invokingObj.obj.x + toRelativePos.x;
		simpleObj.y = invokingObj.obj.y + toRelativePos.y;
	}

	process.send({
		method: 'rezone',
		id: obj.serverId,
		args: {
			obj: simpleObj,
			newZone: zoneName
		}
	});
};

module.exports = sendObjToZone;
