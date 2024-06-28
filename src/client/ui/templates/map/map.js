define([
	"html!ui/templates/map/template"
	, "css!ui/templates/map/styles"
	, "js/misc/physics"
	, "js/objects/objects"
], function (
	template
	, styles
	, physics
	, objectsModule
) {
	const CANVAS_SCALE = 4;
	return {
		tpl: template

		, mapScale: CANVAS_SCALE * 2
		, itemColors: {
			default:  "#FF00FF" // Purple
			, mobs: {
				default: "#FF0000" // Red
			}
			, characters: {
				default: "#00FF00" // Green
			}
			, me: "#FFFF00" // Yellow
			, player: {
				default: "#FFFF00" // Yellow
			}
			, hidden: {
				default: "#ABABAB" // Gray
				, sound: "#9A9AFF"
			}
			, bigObjects: {
				default: "#0000FF" // Blue
			}
		}

		, postRender: function () {
			for (const eventName in this.events) {
				this.onEvent(eventName, this.events[eventName].bind(this));
			}
			this.el.on("click", this.toggleMap.bind(this));
			this.uiContainer = $(".ui-container");
			this.el.addClass("uiMapMini");
			this.el.css("display", "block");
		}

		, toggleMap: function() {
			if (this.el.hasClass("uiMapBig")) {
				this.uiContainer.removeClass("blocking");
				this.el.removeClass("uiMapBig");
				this.el.addClass("uiMapMini");
				return;
			}
			this.el.removeClass("uiMapMini");
			this.el.addClass("uiMapBig");
			this.uiContainer.addClass("blocking");
			this.drawMap();
		}

		, drawMap: _.debounce(function() {
			if (!physics.grid) {
				return;
			}
			const canvasElement = this.el[0];
			canvasElement.width = physics.grid.length * CANVAS_SCALE;
			canvasElement.height = physics.grid[0].length * CANVAS_SCALE;
			const ctx = canvasElement.getContext("2d");
			ctx.translate(canvasElement.width / 2, canvasElement.height / 2);
			ctx.scale(this.mapScale, this.mapScale);
			ctx.translate(-player.x, -player.y);
			ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
			for (let i = 0; i < physics.grid.length; i++) {
				for (let j = 0; j < physics.grid[i].length; j++) {
					if (physics.grid[i][j]) {
						// Collision
						ctx.fillStyle = "rgba(117, 123, 146, 0.2)";
					} else {
						// Walkable
						ctx.fillStyle = "rgba(0, 0, 0, 1)";
					}
					ctx.fillRect(i, j, 1, 1);
				}
			}
			objectsModule.objects.forEach((obj) => {
				if (obj.destroyed || !obj.updateVisibility) {
					return;
				}
				this.drawMapItem(ctx, obj);
			});
			if (Date.now() % 1000 > 500) { // Blink each half second when obscured.
				// Draw player again on top of other objects.
				this.drawMapItem(ctx, window.player);
			}
		// 250ms - 4FPS
		}, 250, true, true)

		, getItemType: function(obj) {
			if (obj.isVisible && obj.sprite) {
				if (obj.account || obj.player) {
					if (window.player.id == obj.id) {
						return "me";
					}
					return ["player", obj.account || obj.name];
				}
				return [obj.sheetName, obj.name];
			}
			if (obj.sound) {
				return ["hidden", "sound"];
			}
			//obj.aggro
			//obj.isRare
			return ["hidden", obj.name];
		}
		, getMapItemColor: function(itemTypeInfo) {
			if (typeof itemTypeInfo == "object") {
				itemTypeInfo = this.getItemType(itemTypeInfo);
			}
			if (typeof itemTypeInfo == "string") {
				itemTypeInfo = itemTypeInfo.split(".");
			}
			const colorDef = this.itemColors[itemTypeInfo[0]];
			if (typeof colorDef == "string") {
				return colorDef;
			} else if (colorDef) {
				return colorDef[itemTypeInfo[1]] || colorDef.default;
			}
			return this.itemColors.default;
		}
		, drawMapItem: function(ctx, obj) {
			ctx.fillStyle = this.getMapItemColor(obj);
			ctx.fillRect(obj.x, obj.y, 1, 1);
		}

		, events: {
			onGetObject: function(object) {
				if (!object.id) {
					return;
				}
				this.drawMap();
			}
			, onKeyDown: function (key) {
				if (!key) {
					return;
				}
				if (this.el.css("display") != "block") {
					// Map hidden...
					return;
				}
				if (key == "m") {
					this.toggleMap();
					return;
				}
				if (key == "13" && this.mapScale > CANVAS_SCALE) {
					this.mapScale--;
					this.drawMap();
					return;
				}
				if (key == "11" && this.mapScale < 11) {
					this.mapScale++;
					this.drawMap();
					return;
				}
			}
		}
	};
});
