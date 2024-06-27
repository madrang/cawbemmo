define([
	"html!ui/templates/map/template"
	, "js/misc/physics"
	, "js/objects/objects"
], function (
	template
	, physics
	, objectsModule
) {
	return {
		tpl: template

		, mapScale: 4
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
			for (const eventName of Object.keys(this.events)) {
				this.onEvent(eventName, this.events[eventName].bind(this));
			}
			this.uiContainer = $(".ui-container");
		}

		, toggleMap: function() {
			if (this.el.css("display") == "block") {
				this.uiContainer.removeClass("blocking");
				this.el.css("display", "none");
				return;
			}
			this.el.css("display", "block");
			this.uiContainer.addClass("blocking");
			this.drawMap();
		}

		, drawMap: _.debounce(function() {
			if (!physics.grid) {
				return;
			}
			const mapScale = this.mapScale;
			const elWidth = physics.grid.length * mapScale;
			const elHeight = physics.grid[0].length * mapScale;

			const canvasElement = this.el[0];
			canvasElement.width = elWidth;
			canvasElement.height = elHeight;

			const ctx = canvasElement.getContext('2d');
			ctx.scale(mapScale, mapScale);
			ctx.clearRect(0, 0, elWidth, elHeight);

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
			this.el.css({
				"position": "absolute"
				, "left": (this.uiContainer[0].clientWidth / 2) - (elWidth / 2)
				, "top": (this.uiContainer[0].clientHeight / 2) - (elHeight / 2)
				, "background-color": "transparent"
				, "border": "4px solid #505360"
			});
		}, 150, true, true)

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
				if (key == "m") {
					this.toggleMap();
					return;
				}
				if (this.el.css("display") != "block") {
					// Map hidden...
					return;
				}
				if (key == "13" && this.mapScale > 1) {
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
