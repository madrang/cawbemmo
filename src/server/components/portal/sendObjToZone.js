/*
	atlas.onMessage.event / events -> only send if source zone = obj zoneName

	SERVER SIDE
	1. Change zone and position
	2. Save
	3. Syncer: Destroy, Flush and Notify other objects of destroyed obj
	4. Log IN CASE (if new events are queued)
	5. Stage rezone
	6. Tell client rezone is happening

	CLIENT SIDE
	events.emit('rezoneStart');

	events.emit('destroyAllObjects');
	events.emit('resetRenderer');
	events.emit('resetPhysics');
	events.emit('clearUis');

	client.request({
		threadModule: 'rezoneManager',
		method: 'clientAck',
		data: {}
	});

	SERVER SIDE
	7. Server receives ack
	8. Map thread tells main thread about rezone
	9. Main thread does rezone
	10. New map thread registers handshake for map send
	11. New map thread sends new map
	
	CLIENT SIDE
	events.emit('onGetMap', msg);

	client.request({
		threadModule: 'instancer',
		method: 'clientAck',
		data: {}
	});

	SERVER SIDE
	12. Add object to zone
*/

const sendObjToZone = async ({ obj, invokingObj, zoneName, toPos, toRelativePos }) => {
	const { serverId, instance: { syncer: globalSyncer, physics } } = obj;

	if (obj.zoneName === zoneName) {
		globalSyncer.flushForTarget(serverId);

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

		globalSyncer.queue('teleportToPosition', {
			x: obj.x,
			y: obj.y
		}, [obj.serverId]);

		return;
	}

	//We set this before saving so that objects aren't saved ON portals
	obj.zoneName = zoneName;
	if (toPos) {
		obj.x = toPos.x;
		obj.y = toPos.y;
	} else if (toRelativePos) {
		obj.x = invokingObj.obj.x + toRelativePos.x;
		obj.y = invokingObj.obj.y + toRelativePos.y;
	}

	await obj.auth.doSave();

	//Destroy, flush events and notify other objects
	globalSyncer.processDestroyedObject(obj);

	//Test code, remove later
	const queued = Object.values(globalSyncer.buffer).filter(b => b.to.includes(serverId));
	if (queued.length) {
		/* eslint-disable-next-line */
		console.log('Found', queued.length, 'events for rezoning object');
	}

	const simpleObj = obj.getSimple(true, false, true);

	rezoneManager.stageRezone(simpleObj, zoneName);

	process.send({
		method: 'events',
		data: {
			rezoneStart: [{
				obj: { msg: {} },
				to: [serverId]
			}]
		}
	});
};

module.exports = sendObjToZone;
