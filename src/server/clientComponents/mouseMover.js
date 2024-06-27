define([
	"js/system/events"
	, "js/rendering/renderer"
	, "js/system/client"
	, "js/input"
	, "js/objects/objects"
	, "js/misc/physics"
], function (
	events
	, renderer
	, client
	, input
	, objects
	, physics
) {
	return {
		type: "mouseMover"

		, hoverTile: {
			x: 0
			, y: 0
		}
		, path: []
		, pathColor: "rgba(255, 255, 255, 0.5)"
		, opacityCounter: 0
		, sprite: null

		, init: function () {
			this.hookEvent("onUiHover", this.onUiHover.bind(this, true));
			this.hookEvent("onUiLeave", this.onUiHover.bind(this, false));
			//TODO onSceneMove
			//this.hookEvent("mouseDown", this.onMouseInput.bind(this));
			//this.hookEvent("mouseMove", this.onMouseInput.bind(this));

			this.sprite = renderer.buildObject({
				layerName: "effects"
				, x: 0
				, y: 0
				, sheetName: "ui"
				, cell: 7
			});
		}

		, onMouseInput: function (e) {
			if (!e || !e.buttons.includes(0)) {
				return;
			}
			if (!this.obj.pather) {
				return;
			}
			let dx = Math.floor(e.x / scale) - this.obj.pather.pathPos.x;
			let dy = Math.floor(e.y / scale) - this.obj.pather.pathPos.y;
			const distance = Math.max(Math.abs(dx), Math.abs(dy));
			if (distance < 1 || distance > 2) {
				return;
			}
			if (Math.abs(dx) > 1) {
				dx /= Math.abs(dx);
			}
			if (Math.abs(dy) > 1) {
				dy /= Math.abs(dy);
			}
			const newX = Math.floor(this.obj.pather.pathPos.x + dx);
			const newY = Math.floor(this.obj.pather.pathPos.y + dy);
			const spTarget = this.obj.spellbook?.target;
			if (spTarget) {
				if (spTarget.x === newX && spTarget.y === newY) {
					return;
				}
			}
			if (physics.isTileBlocking(newX, newY)) {
				this.bump(dx, dy);
				return;
			}
			this.obj.pather.add(newX, newY);
		}

		, onUiHover: function (dunno, onUiHover) {
			if (this.sprite) {
				this.sprite.visible = !onUiHover;
			}
		}

		, bump: function (dx, dy) {
			if (this.obj.pather.path.length > 0) {
				return;
			}
			if (this.obj.bumpAnimation) {
				return;
			}
			events.emit("onObjCollideBump", this.obj);
			this.obj.addComponent("bumpAnimation", {
				deltaX: dx
				, deltaY: dy
			});
		}

		, showPath: function (e) {
			if (e.has("button") && e.button !== 0) {
				return;
			}
			const tileX = Math.floor(e.x / scale);
			const tileY = Math.floor(e.y / scale);
			if ((tileX === this.hoverTile.x) && (tileY === this.hoverTile.y)) {
				return;
			}
			events.emit("onChangeHoverTile", tileX, tileY);

			this.hoverTile.x = Math.floor(e.x / scale);
			this.hoverTile.y = Math.floor(e.y / scale);
			this.sprite.x = (this.hoverTile.x * scale);
			this.sprite.y = (this.hoverTile.y * scale);
		}

		, update: function () {
			this.opacityCounter++;
			if (this.sprite) {
				this.sprite.alpha = 0.35 + Math.abs(Math.sin(this.opacityCounter / 20) * 0.35);
			}
			this.showPath(input.mouse);
			this.onMouseInput(input.mouse);
		}

		, destroy: function () {
			renderer.destroyObject({
				sprite: this.sprite
			});
			this.unhookEvents();
		}
	};
});
