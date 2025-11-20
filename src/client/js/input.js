import events from "/js/system/events.js";
import renderer from "/js/rendering/renderer.js";

const INPUT_TYPES = [
	"gamepad"
	, "keyboard"
	, "mouse"
	, "touch"
	, "mobile"
];
const KEYBOARD_MAPPINGS = {
	8: "backspace"
	, 9: "tab"
	, 13: "enter"
	, 16: "shift"
	, 17: "ctrl"
	, 27: "esc"
	, 37: "left"
	, 38: "up"
	, 39: "right"
	, 40: "down"
	, 46: "del"

	//hacks for mac cmd key
	, 224: "ctrl"
	, 91: "ctrl"
	, 93: "ctrl"
};
const KEYBOARD_AXES_DEFAULT = {
	horizontal: {
		negative: ["left", "a", "q", "z"]
		, positive: ["right", "d", "e", "c"]
	}
	, vertical: {
		negative: ["up", "w", "q", "e"]
		, positive: ["down", "s", "x", "z", "c"]
	}
};
const KEYBOARD_KEYS_DEFAULT = {
	modifier_1: {
		values: [ "shift" ]
		, actions: [ "showTooltip" ]
	}
	, modifier_2: [ "ctrl" ]

	, mainmenu: [ "esc" ]

	, gather: [ "u" ]
	, spell_0: [ " " ]
	, spell_1: [ "1" ]
	, spell_2: [ "2" ]
	, spell_3: [ "3" ]
	, spell_4: [ "4" ]
	, target: [ "tab" ]
};
const GAMEPAD_UPDATE_DELAY = 33;
const GAMEPAD_AXES_DEFAULT = {
	horizontal: 0
	, vertical: 1
	, cameraX: 2
	, cameraY: 3
};
const GAMEPAD_BUTTONS_DEFAULT = {
	/** Standard Gamepad buttons
	 * 0	Bottom button in right cluster
	 * 1	Right button in right cluster
	 * 2	Left button in right cluster
	 * 3	Top button in right cluster
	 * 4	Top left front button
	 * 5	Top right front button
	 * 6	Bottom left front button
	 * 7	Bottom right front button
	 * 8	Left button in center cluster
	 * 9	Right button in center cluster
	 * 10	Left stick pressed button
	 * 11	Right stick pressed button
	 * 12	Top button in left cluster
	 * 13	Bottom button in left cluster
	 * 14	Left button in left cluster
	 * 15	Right button in left cluster
	 * 16	Center button in center cluster
	 */
	modifier_1: {
		values: [ 4 ]
		, actions: [ "showTooltip" ]
		, spell_1: [ 0 ]
		, spell_2: [ 1 ]
		, spell_3: [ 2 ]
		, spell_4: [ 3 ]
	}
	, modifier_2: [ 5 ]

	, mainmenu: [ 9 ]

	, spell_0: [ 0 ]
	, gather: [ 1 ]
	, target: [ 2 ]
};

export default {
	axes: {}
	, mappings: {}
	, actions: {}

	, numericalKeyCodeMappings: {
		Digit1: 49
		, Digit2: 50
		, Digit3: 51
		, Digit4: 52
		, Digit5: 53
	}

	, mouse: {
		buttons: []
		, x: 0
		, y: 0
	}

	, pressedKeys: {} // Obj for Named keys
	, pressedMouseButtons: [] // Sparse array for button indexes.
	, pressedGamepadButtons: [] // Sparse array for button indexes.

	, blacklistedKeys: []
	, whitelistedKeys: []

	, gamepads: []
	, lastGamepadActionsUpdate: 0

	, init: function (container) {
		this.uiContainer = document.querySelector(container);
		if (!this.uiContainer) {
			throw new Error("ui-container not found!");
		}

		//TODO Load user configs.
		_.assign(this.axes, {
			gamepad: GAMEPAD_AXES_DEFAULT
			, keyboard: KEYBOARD_AXES_DEFAULT
		});
		_.assign(this.mappings, {
			gamepad: GAMEPAD_BUTTONS_DEFAULT
			, keyboard: KEYBOARD_KEYS_DEFAULT
		});

		if (typeof navigator.getGamepads === "function") {
			this.gamepads = navigator.getGamepads();
		}

		window.addEventListener("gamepadconnected", this.events.gamepad.connected.bind(this));
		window.addEventListener("gamepaddisconnected", this.events.gamepad.disconnected.bind(this));
		window.addEventListener("keydown", this.events.keyboard.down.bind(this));
		window.addEventListener("keyup", this.events.keyboard.up.bind(this));

		this.uiContainer.addEventListener("mousedown", this.events.mouse.down.bind(this));
		this.uiContainer.addEventListener("mouseup", this.events.mouse.up.bind(this));
		this.uiContainer.addEventListener("mousemove", this.events.mouse.move.bind(this));
		this.uiContainer.addEventListener("touchstart", this.events.touch.start.bind(this));
		this.uiContainer.addEventListener("touchmove", this.events.touch.move.bind(this));
		this.uiContainer.addEventListener("touchend", this.events.touch.end.bind(this));
		this.uiContainer.addEventListener("touchcancel", this.events.touch.cancel.bind(this));

		events.on("onSceneMove", this.events.mouse.onSceneMove.bind(this));

		if (isMobile) {
			(async () => {
				const exportedModule = await import("/plugins/shake.js");
				return exportedModule.default;
			})().then(this.onLoadShake.bind(this));
		}

		_.log.input.debug("Gamepads: %o", this.gamepads);
		for (const gamepad of this.gamepads) {
			if (!gamepad) {
				continue;
			}
			_.log.input.gamepad.debug(
				"Found gamepad[%d]: %s. %d buttons, %d axes."
				, gamepad.index
				, gamepad.id
				, gamepad.buttons.length
				, gamepad.axes.length
			);
		}
	}

	, update: function () {
		if (typeof navigator.getGamepads === "function") {
			this.updateGamepads();
		}
	}

	, isUIVisible: function () {
		const timestamp = performance.now();
		if (this.isUIVisible.lastUpdate > timestamp - 500) {
			return this.isUIVisible.lastValue;
		}
		const uiElems = this.uiContainer.querySelectorAll(".modal, .uiOverlay");
		let isVisible = false;
		for (const element of uiElems.values()) {
			if (element.offsetHeight > 0 && element.offsetWidth > 0) {
				isVisible = true;
				break;
			}
		}
		this.isUIVisible.lastUpdate = timestamp;
		this.isUIVisible.lastValue = isVisible;
		return isVisible;
	}

	, updateGamepads: function () {
		let lastUpdated = Number.POSITIVE_INFINITY;
		// Check all connected gamepads for the most stale timestamp (smaller is older).
		for (const gamepad of this.gamepads) {
			if (!gamepad) {
				continue;
			}
			if (gamepad.timestamp < lastUpdated) {
				lastUpdated = gamepad.timestamp;
			}
		}
		const timestamp = performance.now();
		if (lastUpdated === Number.POSITIVE_INFINITY
			// When no gamepads connected, check every two seconds.
			? Math.floor(timestamp / 1000) % 2 === 0
			// With gamepad connected, poll the data after configured delay.
			: lastUpdated < timestamp - GAMEPAD_UPDATE_DELAY
		) {
			this.gamepads = navigator.getGamepads();
		}
		if (lastUpdated === Number.POSITIVE_INFINITY) {
			if (this.pressedGamepadButtons.length) {
				// All gamepads disconnected with pressed buttons.
				for (const button in this.pressedGamepadButtons) {
					delete this.pressedGamepadButtons[button];
					const removedActions = this.getMapping("gamepad", button);
					for (const action of removedActions) {
						delete this.actions[action];
					}
				}
			}
			return;
		}
		if (this.lastGamepadActionsUpdate > timestamp - GAMEPAD_UPDATE_DELAY) {
			// Was updated recently.
			return;
		}
		this.lastGamepadActionsUpdate = timestamp;
		//TODO when UI is visible, change action map to allow using the UI with a gamepad.
		const enableInput = !this.isUIVisible();
		for (const gamepad of this.gamepads) {
			if (!gamepad) {
				continue;
			}
			for (const button in gamepad.buttons) {
				const gButtonInfo = gamepad.buttons[button];
				if (!gButtonInfo) {
					delete this.pressedGamepadButtons[button];
					continue;
				}
				if (gButtonInfo.pressed || gButtonInfo.touched || gButtonInfo.value > 0.1) {
					if (this.pressedGamepadButtons[button]) {
						this.pressedGamepadButtons[button] = 2;
					} else {
						this.pressedGamepadButtons[button] = 1;
						const addedActions = this.getMapping("gamepad", button);
						if (!enableInput) { // Certain actions should always register even if something else is the target.
							addedActions.spliceWhere((a) => !a.startsWith("modifier_"));
						}
						for (const action of addedActions) {
							if (this.actions[action]) {
								this.actions[action] = 2;
							} else {
								this.actions[action] = 1;
								const actionEvent = { action, consumed: false };
								events.emit("uiaction", actionEvent);
								if (!actionEvent.consumed) {
									events.emit("inputaction", action);
								}
							}
						}
					}
				} else if (button in this.pressedGamepadButtons) {
					delete this.pressedGamepadButtons[button];
					const removedActions = this.getMapping("gamepad", button);
					for (const action of removedActions) {
						delete this.actions[action];
					}
				}
			}
		}
	}

	, blacklistKeys: function (list) {
		this.blacklistedKeys.push(...list);
	}

	, unBlacklistKeys: function (list) {
		this.blacklistedKeys.spliceWhere((d) => list.includes(d));
	}

	, whitelistKeys: function (list) {
		this.whitelistedKeys.push(...list);
	}

	, unWhitelistKeys: function (list) {
		this.whitelistedKeys.spliceWhere((d) => list.includes(d));
	}

	, onLoadShake: function (shake) {
		let shaker = new shake({
			threshold: 5
			, timeout: 1000
		});
		shaker.start();
		window.addEventListener("shake", this.events.mobile.shake.bind(this), false);
	}

	, resetKeys: function () {
		for (const key in this.pressedKeys) {
			const removedActions = this.getMapping("keyboard", key);
			for (const action of removedActions) {
				delete this.actions[action];
			}
			events.emit("keyup", key);
		}
		this.pressedKeys = {};

		for (const i in this.pressedMouseButtons) {
			events.emit("mouseup", i);
		}
		this.pressedMouseButtons = [];
	}

	, convertKeyCode: function (charCode) {
		if (charCode in KEYBOARD_MAPPINGS) {
			return KEYBOARD_MAPPINGS[charCode];
		}
		if (charCode >= 97) {
			return (charCode - 96).toString();
		}
		return String.fromCharCode(charCode).toLowerCase();
	}

	, getMapping: function (inputType, eventValue) {
		const inputMap = this.mappings[inputType];
		if (!inputMap) {
			_.log.input.getMapping.warn("Unknown input type %s", inputType);
			return [];
		}
		if (inputType === "keyboard" && typeof eventValue !== "string") {
			eventValue = String(eventValue);
		} else if (inputType === "gamepad" && typeof eventValue !== "number") {
			const newVal = Number.parseInt(eventValue);
			if (!Number.isFinite(newVal)) {
				_.log.input.getMapping.gamepad.warn("Invalid input value '%s', a number is required.", eventValue);
				return [];
			}
			eventValue = newVal;
		}
		const isMatch = (inputValues) => {
			if (inputValues === undefined) {
				_.log.input.getMapping.warn("inputValues is undefined!");
				return false;
			}
			return (inputValues === eventValue
				|| (Array.isArray(inputValues) && inputValues.includes(eventValue))
			);
		};
		const actions = [];
		let done = false;
		for (const actionName in this.actions) { // Check already active actions first.
			if (!this.actions.hasOwnProperty(actionName)) {
				continue;
			}
			const inputValues = inputMap[actionName];
			if (inputValues === undefined) {
				continue;
			}
			if (isMatch(inputValues)) {
				actions.push(actionName);
				done = true;
				continue;
			}
			if (typeof inputValues !== "object") {
				continue;
			}
			done = true;
			if (isMatch(inputValues.values)) {
				// Allow removal of active actions sets.
				actions.push(actionName);
				if (inputValues.actions) {
					actions.push(...inputValues.actions);
				}
			}
			for (const subActionName in inputValues) {
				if (subActionName === "values" || subActionName === "actions"
					|| !inputValues.hasOwnProperty(subActionName)
				) {
					continue;
				}
				const actionValues = inputValues[subActionName];
				if (isMatch(actionValues)) {
					actions.push(subActionName);
				}
			}
		}
		if (done) {
			return actions;
		}
		for (const actionName in inputMap) {
			if (!inputMap.hasOwnProperty(actionName)) {
				continue;
			}
			const inputValues = inputMap[actionName];
			if (isMatch(inputValues)) {
				actions.push(actionName);
				continue;
			}
			if (typeof inputValues === "object" && isMatch(inputValues.values)) {
				actions.push(actionName);
				if (inputValues.actions) {
					actions.push(...inputValues.actions);
				}
			}
		}
		return actions;
	}

	, isActive: function (action, noConsume) {
		const active = this.actions[action];
		if (active) {
			if (noConsume) {
				return true;
			}
			this.actions[action] = 2;
			return (active === 1);
		}
		return false;
	}

	, isKeyDown: function (key, noConsume) {
		const down = this.pressedKeys[key];
		if (down) {
			if (noConsume) {
				return true;
			}
			this.pressedKeys[key] = 2;
			return (down === 1);
		}
		return false;
	}

	, isMouseButtonDown: function (button, noConsume) {
		const down = this.pressedMouseButtons[button];
		if (down) {
			if (noConsume) {
				return true;
			}
			this.pressedMouseButtons[button] = 2;
			return (down === 1);
		}
		return false;
	}

	, isGamepadPressed: function (button, noConsume) {
		const down = this.pressedGamepadButtons[button];
		if (down) {
			if (noConsume) {
				return true;
			}
			this.pressedGamepadButtons[button] = 2;
			return (down === 1);
		}
		return false;
	}

	, getAxis: function (axisName) {
		let result = 0;
		for (const inputType of INPUT_TYPES) {
			const inputAxes = this.axes[inputType];
			if (!inputAxes) {
				continue;
			}
			if (!inputAxes.has(axisName)) {
				continue;
			}
			const axis = inputAxes[axisName];
			switch (inputType) {
				case "gamepad":
					for (const gamepad of this.gamepads) {
						if (!gamepad || !gamepad.axes.has(axis)) {
							continue;
						}
						result += Math.round(gamepad.axes[axis]);
					}
					break;
				case "keyboard":
					for (let i = axis.negative.length - 1; i >= 0; --i) {
						if (this.pressedKeys[axis.negative[i]]) {
							result--;
							break;
						}
					}
					for (let i = axis.positive.length - 1; i >= 0; --i) {
						if (this.pressedKeys[axis.positive[i]]) {
							result++;
							break;
						}
					}
					break;
			}
		}
		return result;
	}

	, isKeyAllowed: function (key) {
		const result = (key.length > 1
			|| this.whitelistedKeys.includes(key)
			|| (!this.blacklistedKeys.includes(key) && !this.blacklistedKeys.includes("*"))
		);
		return result;
	}

	, events: {
		keyboard: {
			down: function (e) {
				const code = this.numericalKeyCodeMappings[e.code] || e.which;
				const key = this.convertKeyCode(code);
				// Certain keys should always register even if they don't get emitted
				let isModifier = false;
				if (this.mappings.keyboard) {
					for (const actionName in this.mappings.keyboard) {
						if (!actionName.startsWith("modifier_")) {
							continue;
						}
						const modifier = this.mappings.keyboard[actionName];
						if (modifier?.values === key || Array.isArray(modifier?.values) && modifier.values.includes(key)) {
							isModifier = true;
						}
					}
				}
				const isBody = e.target === document.body;
				if (!isModifier && !isBody) {
					return true;
				}
				if (e.keyCode === 9 || e.keyCode === 8 || e.keyCode === 122) {
					e.preventDefault();
				}
				if (!this.isKeyAllowed(key)) {
					return;
				}
				const addedActions = this.getMapping("keyboard", key);
				if (!isBody) {
					addedActions.spliceWhere((a) => !a.startsWith("modifier_"));
				}
				for (const action of addedActions) {
					if (this.actions[action]) {
						this.actions[action] = 2;
					} else {
						this.actions[action] = 1;
						const actionEvent = { action, consumed: false };
						events.emit("uiaction", actionEvent);
						if (!actionEvent.consumed) {
							events.emit("inputaction", action);
						}
					}
				}
				if (this.pressedKeys[key]) {
					this.pressedKeys[key] = 2;
				} else if (isBody || isModifier) {
					this.pressedKeys[key] = 1;
					const keyEvent = { key, consumed: false };
					events.emit("uikeypress", keyEvent);
					if (!keyEvent.consumed) {
						events.emit("keydown", key);
					}
				}
				if (key === "backspace") {
					return false;
				} else if (e.key === "F11") {
					events.emit("onToggleFullscreen");
				}
			}
			, up: function (e) {
				const code = this.numericalKeyCodeMappings[e.code] || e.which;
				const key = this.convertKeyCode(code);
				if (key in this.pressedKeys) {
					delete this.pressedKeys[key];
					const removedActions = this.getMapping("keyboard", key);
					for (const action of removedActions) {
						delete this.actions[action];
					}
					events.emit("keyup", key);
				}
			}
		}

		, mouse: {
			down: function (e) {
				this.mouse.x = e.clientX;
				this.mouse.y = e.clientY;
				this.mouse.worldX = e.clientX + renderer.pos.x;
				this.mouse.worldY = e.clientY + renderer.pos.y;

				this.pressedMouseButtons[e.button] = 1;
				this.mouse.button = e.button;
				this.mouse.buttons = Object.keys(this.pressedMouseButtons).map((n) => Number.parseInt(n));

				if (e.target !== this.uiContainer
					|| this.uiContainer.classList.contains("blocking")
				) {
					return;
				}
				const mouseEvent = _.assign({
					event: e
				}, this.mouse);
				events.emit("mousedown", mouseEvent);
			}
			, up: function (e) {
				this.mouse.x = e.clientX;
				this.mouse.y = e.clientY;
				this.mouse.worldX = e.clientX + renderer.pos.x;
				this.mouse.worldY = e.clientY + renderer.pos.y;

				if (!this.pressedMouseButtons[e.button]) {
					delete this.mouse.button;
					return;
				}
				delete this.pressedMouseButtons[e.button];
				this.mouse.button = e.button;
				this.mouse.buttons = Object.keys(this.pressedMouseButtons).map((n) => Number.parseInt(n));

				if (e.target !== this.uiContainer
					|| this.uiContainer.classList.contains("blocking")
				) {
					return;
				}
				const mouseEvent = _.assign({
					event: e
				}, this.mouse);
				events.emit("mouseup", mouseEvent);
			}
			, move: function (e) {
				this.mouse.x = e.clientX;
				this.mouse.y = e.clientY;
				this.mouse.worldX = e.clientX + renderer.pos.x;
				this.mouse.worldY = e.clientY + renderer.pos.y;
				if (this.mouse.has("button") && !this.mouse.buttons.includes(this.mouse.button)) {
					delete this.mouse.button;
				}

				if (e.target !== this.uiContainer
					|| this.uiContainer.classList.contains("blocking")
				) {
					return;
				}
				const mouseEvent = _.assign({
					event: e
				}, this.mouse);
				events.emit("mousemove", mouseEvent);
			}
			, onSceneMove: function (e) {
				this.mouse.worldX += e.x;
				this.mouse.worldY += e.y;

				const mouseEvent = _.assign({
					event: e
				}, this.mouse);
				events.emit("mousemove", mouseEvent);
			}
		}

		, touch: {
			start: function (e) {
				const touch = e.touches[0];
				this.mouse.x = touch.clientX;
				this.mouse.y = touch.clientY;

				if (e.target !== this.uiContainer
					|| this.uiContainer.classList.contains("blocking")
				) {
					return;
				}
				events.emit("touchstart", {
					x: touch.clientX
					, y: touch.clientY
					, worldX: touch.clientX + renderer.pos.x
					, worldY: touch.clientY + renderer.pos.y
				});
			}
			, move: function (e) {
				const touch = e.touches[0];
				this.mouse.x = touch.clientX;
				this.mouse.y = touch.clientY;

				if (e.target !== this.uiContainer
					|| this.uiContainer.classList.contains("blocking")
				) {
					return;
				}
				events.emit("touchmove", {
					x: touch.clientX
					, y: touch.clientY
					, touches: e.touches.length
				});
			}
			, end: function (e) {
				events.emit("touchend", e);
			}
			, cancel: function (e) {
				events.emit("touchcancel", e);
			}
		}

		, mobile: {
			shake: function (e) {
				events.emit("shake", e);
			}
		}

		, gamepad: {
			connected: function (e) {
				_.log.input.gamepad.debug("Gamepad connected %o", e);
				const gamepad = e.gamepad;
				if (!gamepad) {
					return;
				}
				_.log.input.gamepad.debug(
					"Gamepad connected at index %d: %s. %d buttons, %d axes."
					, gamepad.index
					, gamepad.id
					, gamepad.buttons.length
					, gamepad.axes.length
				);
				this.gamepads[gamepad.index] = gamepad;
			}
			, disconnected: function (e) {
				_.log.input.gamepad.debug("Gamepad disconnected %o", e);
				const gamepad = e.gamepad;
				if (!gamepad) {
					return;
				}
				_.log.input.gamepad.debug(
					"Gamepad disconnected from index %d: %s"
					, gamepad.index
					, gamepad.id
				);
				delete this.gamepads[gamepad.index];
			}
		}
	}
};
