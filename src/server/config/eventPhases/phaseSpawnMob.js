define([
	'../../world/mobBuilder'
], function (
	mobBuilder
) {
	return {
		spawnRect: null,
		mobs: null,

		init: function () {
			var objects = this.instance.objects;
			var spawnRect = this.spawnRect;

			if (!this.mobs.push)
				this.mobs = [this.mobs];

			var usedSpots = ['-1,-1'];

			this.mobs.forEach(function (l) {
				var amount = l.amount || 1;
				delete l.amount;

				l.walkDistance = 0;

				for (var i = 0; i < amount; i++) {
					var x = -1;
					var y = -1;

					var pos = l.pos;
					if (pos) {
						if (pos instanceof Array) {
							x = pos[i].x;
							y = pos[i].y;
						} else {
							x = pos.x;
							y = pos.y;
						}

						if (spawnRect) {
							x += spawnRect.x;
							y += spawnRect.y;
						}
					} else {
						while (usedSpots.indexOf(x + ',' + y) > -1) {
							x = spawnRect.x + ~~(Math.random() * spawnRect.w);
							y = spawnRect.y + ~~(Math.random() * spawnRect.h);
						}

						usedSpots.push(x + ',' + y);
					}

					if (l.exists) {
						var mob = objects.objects.find(o => (o.name == l.name));
						mob.mob.walkDistance = 0;
						this.spawnAnimation(mob);
						mob.performMove({
							force: true,
							data: {
								x: x,
								y: y
							}
						});
						this.spawnAnimation(mob);
						this.event.objects.push(mob);
					} else {
						var mob = objects.buildObjects([{
							x: x,
							y: y,
							sheetName: l.sheetName || 'mobs',
							cell: l.cell,
							name: l.name,
							properties: l.properties
						}]);

						mobBuilder.build(mob, l);
						this.spawnAnimation(mob);

						if (l.id) {
							var id = l.id.split('$').join(i);
							mob.id = id;
						}

						this.event.objects.push(mob);
						console.log(mob);

						if (l.dialogue) {
							mob.addComponent('dialogue', {
								config: l.dialogue.config
							});

							if (l.dialogue.auto) {
								mob.dialogue.trigger = objects.buildObjects([{
									properties: {
										x: mob.x - 1,
										y: mob.y - 1,
										width: 3,
										height: 3,
										cpnNotice: {
											actions: {
												enter: {
													cpn: 'dialogue',
													method: 'talk',
													args: [{
														targetName: 'angler nayla'
													}]
												},
												exit: {
													cpn: 'dialogue',
													method: 'stopTalk'
												}
											}
										}
									}
								}]);
							}
						}

						if (l.trade)
							mob.addComponent('trade', l.trade);

						if (l.chats)
							mob.addComponent('chatter', l.chats);
					}
				}
			}, this);

			if (!this.endMark)
				this.end = true;
		},

		spawnAnimation: function (mob) {
			this.instance.syncer.queue('onGetObject', {
				x: mob.x,
				y: mob.y,
				components: [{
					type: 'attackAnimation',
					row: 0,
					col: 4
				}]
			});
		}
	};
});
