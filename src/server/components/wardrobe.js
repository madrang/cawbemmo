define([
	'config/skins'
], function (
	skins
) {
	return {
		type: 'wardrobe',

		init: function (blueprint) {
			var o = this.obj.instance.objects.buildObjects([{
				properties: {
					x: this.obj.x - 1,
					y: this.obj.y - 1,
					width: 3,
					height: 3,
					cpnNotice: {
						actions: {
							enter: {
								cpn: 'wardrobe',
								method: 'enterArea',
								targetId: this.obj.id,
								args: []
							},
							exit: {
								cpn: 'wardrobe',
								method: 'exitArea',
								targetId: this.obj.id,
								args: []
							}
						}
					}
				}
			}]);
		},

		exitArea: function (obj) {
			if (!obj.player)
				return;

			obj.syncer.setArray(true, 'serverActions', 'removeActions', {
				key: 'u',
				action: {
					targetId: this.obj.id,
					cpn: 'wardrobe',
					method: 'access'
				}
			});

			this.obj.instance.syncer.queue('onCloseWardrobe', null, [obj.serverId]);
		},

		enterArea: function (obj) {
			if (!obj.player)
				return;

			var msg = `Press U to access the wardrobe`;

			obj.syncer.setArray(true, 'serverActions', 'addActions', {
				key: 'u',
				action: {
					targetId: this.obj.id,
					cpn: 'wardrobe',
					method: 'open'
				}
			});

			this.obj.instance.syncer.queue('onGetAnnouncement', {
				src: this.obj.id,
				msg: msg
			}, [obj.serverId]);
		},

		open: function (msg) {
			if (msg.sourceId == null)
				return;

			var obj = this.obj.instance.objects.objects.find(o => o.serverId == msg.sourceId);
			if ((!obj) || (!obj.player))
				return;

			var thisObj = this.obj;
			if ((Math.abs(thisObj.x - obj.x) > 1) || (Math.abs(thisObj.y - obj.y) > 1))
				return;

			obj.auth.getSkins({
				callback: this.onGetSkins.bind(this, obj)
			});
		},

		apply: function (msg) {
			var obj = this.obj.instance.objects.objects.find(o => o.serverId == msg.sourceId);
			if (!obj)
				return;

			obj.skinId = msg.skinId;

			obj.cell = skins.getCell(obj.skinId);
			obj.sheetName = skins.getSpritesheet(obj.skinId);

			var syncer = obj.syncer;
			syncer.set(false, null, 'cell', obj.cell);
			syncer.set(false, null, 'sheetName', obj.sheetName);
		},

		onGetSkins: function (obj, skins) {
			this.obj.instance.syncer.queue('onGetWardrobeSkins', {
				id: this.obj.id,
				skins: skins[obj.class]
			}, [obj.serverId]);
		}
	};
});
