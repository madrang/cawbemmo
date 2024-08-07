define([
	"js/system/events"
], function (
	events
) {
	return {
		centeredX: false
		, centeredY: false

		, el: null
		, options: null
		, shown: true

		, eventCallbacks: {}

		, render: function () {
			let container = ".ui-container";
			if (this.container) {
				container += " > " + this.container;
			}
			if (this.beforeRender) {
				this.beforeRender();
			}
			this.el = $(this.tpl)
				.appendTo(container)
				.data("ui", this);

			this.el.on("mouseenter", this.onMouseEnter.bind(this, true));
			this.el.on("mouseleave", this.onMouseEnter.bind(this, false));

			if (this.modal) {
				this.el.addClass("modal");
				this.makeElementDraggable();
			}
			if (this.hasClose) {
				this.buildClose();
			}
			if (this.postRender) {
				this.postRender();
			}
			if (this.centered) {
				this.centeredX = true;
				this.centeredY = true;
			}
			if ((this.centeredX) || (this.centeredY)) {
				this.center(this.centeredX, this.centeredY);
			}
			this.registerUiEvents();

			this.shown = this.el.is(":visible");

			events.emit("onAfterRenderUi", {
				ui: this
			});
		}

		, registerUiEvents: function () {
			this.find(".btn").on("click", events.emit.bind(events, "onClickButton"));
			this.find(".tab").on("click", events.emit.bind(events, "onClickTab"));
		}

		, onMouseEnter: function (enter) {
			events.emit("onUiHover", enter);
		}

		, setOptions: function (options) {
			this.options = options;
		}

		, on: function (el, eventName, callback) {
			if (typeof (el) === "string") {
				el = this.find(el);
			} else {
				el = $(el);
			}
			el.on(eventName, function (e) {
				callback(e, eventName);
			});
		}

		, find: function (selector) {
			return this.el.find(selector);
		}

		, center: function (x, y) {
			if (x !== false) {
				x = true;
			}
			if (y !== false) {
				y = true;
			}
			this.centeredX = x;
			this.centeredY = y;

			let el = this.el;
			let pat = el.parent();
			if (!pat[0]) {
				return;
			}
			let posX = Math.floor((pat.width() / 2) - (el.width() / 2));
			let posY = Math.floor((pat.height() / 2) - (el.height() / 2));

			el.css("position", "absolute");
			if (x) {
				el.css("left", posX);
			}
			if (y) {
				el.css("top", posY);
			}
		}

		, show: function () {
			if (this.shown) {
				return;
			}
			if (this.modal) {
				//Close any other open modal
				$(".modal").toArray().forEach((el) => {
					const ui = $(el).data("ui");
					if (ui.shown) {
						ui.hide();
					}
				});
			}
			this.shown = true;
			if (this.isFlex) {
				this.el.css("display", "flex");
			} else {
				this.el.show();
			}
			if (this.onAfterShow) {
				this.onAfterShow();
			}
			if ((this.centeredX) || (this.centeredY)) {
				this.center(this.centeredX, this.centeredY);
			}
			events.emit("onShowUi", this);
		}

		, hide: function () {
			if (!this.shown) {
				return;
			}
			if (this.beforeHide) {
				this.beforeHide();
			}
			this.shown = false;
			this.el.hide();
			if (this.afterHide) {
				this.afterHide();
			}
			events.emit("onHideUi", this);
		}

		, destroy: function () {
			this.offEvents();
			if (this.beforeDestroy) {
				this.beforeDestroy();
			}
			this.el.remove();
		}

		, val: function (selector) {
			return this.find(selector).val();
		}

		, setDisabled: function (isDisabled) {
			this.el.removeClass("disabled");
			if (isDisabled) {
				this.el.addClass("disabled");
			}
		}

		, onEvent: function (eventName, callback) {
			let list = this.eventCallbacks[eventName] || (this.eventCallbacks[eventName] = []);
			let eventCallback = events.on(eventName, callback);
			list.push(eventCallback);
			return eventCallback;
		}

		, offEvent: function (eventCallback) {
			for (let e in this.eventCallbacks) {
				this.eventCallbacks[e].forEach(function (c) {
					if (c === eventCallback) {
						events.off(e, c);
					}
				}, this);
			}
		}

		, offEvents: function () {
			for (let e in this.eventCallbacks) {
				this.eventCallbacks[e].forEach(function (c) {
					events.off(e, c);
				}, this);
			}
		}

		, toggle: function () {
			if (!this.shown) {
				this.show();
			} else {
				this.hide();
			}
			events.emit("onToggleUi", this);
		}

		, buildClose: function () {
			$("<div class=\"btn btnClose\">X</div>")
				.appendTo(this.find(".heading").eq(0))
				.on("click", this.toggle.bind(this));
		}

		, makeElementDraggable: function (elmnt) {
			if (!elmnt) {
				elmnt = this.el;
			}
			if (elmnt instanceof jQuery) {
				elmnt = elmnt[0];
			}
			let lastX = 0, lastY = 0;
			const elementDrag = function (e) {
				e.preventDefault();
				// calculate the new cursor position:
				const deltaX = lastX - e.clientX;
				const deltaY = lastY - e.clientY;
				lastX = e.clientX;
				lastY = e.clientY;
				// set the element's new position:
				elmnt.style.left = `${elmnt.offsetLeft - deltaX}px`;
				elmnt.style.top = `${elmnt.offsetTop - deltaY}px`;
			};
			const closeDragElement = function () {
				// stop moving when mouse button is released:
				document.removeEventListener("mouseup", closeDragElement);
				document.removeEventListener("mousemove", elementDrag);
			};
			const dragMouseDown = function (e) {
				e.preventDefault();
				// get the mouse cursor position at startup:
				lastX = e.clientX;
				lastY = e.clientY;
				document.addEventListener("mouseup", closeDragElement);
				// call a function whenever the cursor moves:
				document.addEventListener("mousemove", elementDrag);
			};
			let header;
			if (elmnt.id) {
				header = document.getElementById(elmnt.id + "header");
			}
			if (!header) {
				header = this.find(".heading")[0];
			}
			if (header) {
				// if present, the header is where you move the DIV from:
				header.addEventListener("mousedown", dragMouseDown);
			} else {
				// otherwise, move the DIV from anywhere inside the DIV:
				elmnt.addEventListener("mousedown", dragMouseDown);
			}
		}
	}
});
