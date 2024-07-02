const takeDamage = (cpnStats, eventDamage) => {
	const { obj, values, syncer } = cpnStats;

	if (values.hp <= 0) {
		return;
	}

	if (!eventDamage.noEvents) {
		eventDamage.source.fireEvent("beforeDealDamage", eventDamage);
		obj.fireEvent("beforeTakeDamage", eventDamage);
	}

	const { source, damage, threatMult = 1, noEvents } = eventDamage;
	const { failed, blocked, dodged, crit, element } = damage;

	if (failed || obj.destroyed) {
		return;
	}

	_.log.takeDamage.trace("%s attacked %s for %s dammage."
		, source.name || source.id
		, obj.name || obj.id
		, damage.amount.toFixed(2)
	);
	const amount = Math.min(values.hp, damage.amount);
	damage.dealt = amount;
	values.hp -= amount;
	const recipients = [];
	if (obj.serverId) {
		recipients.push(obj.serverId);
	}
	if (source.serverId) {
		recipients.push(source.serverId);
	}

	const msg = {
		id: obj.id
		, source: source.id
		, crit
		, amount
		, element
	};
	if (source.follower && source.follower.master.serverId) {
		recipients.push(source.follower.master.serverId);
		msg.masterSource = source.follower.master.id;
	}
	if (obj.follower && obj.follower.master.serverId) {
		recipients.push(obj.follower.master.serverId);
		msg.masterId = obj.follower.master.id;
	}

	if (recipients.length) {
		if (!blocked && !dodged) {
			syncer.queue("onGetDamage", msg, recipients);
		} else {
			syncer.queue("onGetDamage", {
				id: obj.id
				, source: source.id
				, event: true
				, text: blocked ? "blocked" : "dodged"
			}, recipients);
		}
	}

	obj.aggro.tryEngage(source, amount, threatMult);

	let died = (values.hp <= 0);

	if (died) {
		let death = {
			success: true
		};
		obj.instance.eventEmitter.emit("onBeforeActorDies", death, obj, source);
		obj.fireEvent("beforeDeath", death);

		if (death.success) {
			cpnStats.preDeath(source);
		}
	} else {
		source.aggro.tryEngage(obj, 0);
		obj.syncer.setObject(false, "stats", "values", "hp", values.hp);
	}

	if (!noEvents) {
		source.fireEvent("afterDealDamage", eventDamage);
		obj.fireEvent("afterTakeDamage", eventDamage);
	}
};

module.exports = takeDamage;
