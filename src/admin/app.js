require.config({
	baseUrl: ""
	, waitSeconds: 120
	, paths: {
		assign: "/common/assign"
		, text: "/js/dependencies/text.min"
		, html: "/plugins/html"
		, css: "/js/dependencies/css.min"
		, helpers: "/js/misc/helpers"
	}
	, shim: {
		helpers: {
			deps: [
				"assign"
			]
			, exports: "_"
		}
	}
});

require([
	"helpers"
	, "html!templates/userlist"
], function (
	glExport
	, userlistTpl
) {
	const userLevelToString = (level) => {
		if (!level) {
			return "Player";
		}
		if (level <= 9) {
			return "Moderator";
		}
		if (level <= 89) {
			return "Admin";
		}
		return "Owner";
	};
	const buildUserList = async () => {
		const res = await fetch("/api/rest/users");
		if (!res.ok) {
			_.log.getUsers.error("Request failed! Status:", res.statusText);
			return;
		}
		const users = await res.json();
		let uiElm = document.createElement("div");
		uiElm.innerHTML = userlistTpl;
		uiElm = uiElm.querySelector("#user-list");
		const userTpl = uiElm.getElementsByClassName("user")[0];
		for (const user of users) {
			_.log.getUsers.debug("Adding user", user);
			const userElm = userTpl.cloneNode(true);
			userElm.innerHTML = userElm.innerHTML
				.replaceAll("{{username}}", user.username)
				.replaceAll("{{level}}", `[${user.level}] ${userLevelToString(user.level)}`)
				.replaceAll("{{characters}}", JSON.stringify(user.characters));
			userTpl.parentNode.appendChild(userElm);
		}
		userTpl.remove();

		if (uiElm.classList.contains("modal")) {
			buildClose(uiElm);
			makeElementDraggable(uiElm);
		}

		const container = document.getElementById("ui-container");
		container.appendChild(uiElm);
	};

	const onConnected = (accountInfo) => {
		_.log.submitLoginForm.info("Connected", accountInfo);

		const loginElm = document.getElementById("login");
		loginElm.style.display = "none";

		const userMenu = document.getElementById("user-menu");
		userMenu.innerText = `${userLevelToString(accountInfo.level)}/${accountInfo.username} (${accountInfo.level})`;

		for (const elmName of [ "top-menu", "ui-container" ]) {
			const elm = document.getElementById(elmName);
			elm.style.display = "block";
		}

		buildUserList().catch(_.log.buildUserList.error);
	};

	window.submitLoginForm = async (event) => {
		const formData = new FormData(event.target.form);
		const data = {};
		for (const [ key, value ] of formData.entries()) {
			data[key] = value;
		}
		const res = await fetch("/api/auth/login", {
			method: "POST"
			, headers: {
				"Content-Type": "application/json"
			}
			, body: JSON.stringify(data)
		});
		if (!res.ok) {
			_.log.submitLoginForm.info("Request Status: %s - Login failed!", res.statusText);
			return;
		}
		const reply = await res.json();
		onConnected(reply.user);
	};

	// Check if user is currently authentified.
	fetch("/api/auth/self").then(async (res) => {
		if (res.status === 200) {
			return onConnected(await res.json());
		}
		_.log.AdminPanel.info("Not connected!");
		const loginElm = document.getElementById("login");
		loginElm.style.display = "flex";
	}, _.log.AdminPanel.error);
});

function buildClose (uiElm) {
	const heading = uiElm.querySelector(".heading");
	if (!heading) {
		return;
	}
	const btnClose = document.createElement("div");
	btnClose.classList.add("btn", "btnClose");
	btnClose.innerText = "X";
	heading.appendChild(btnClose);
	btnClose.addEventListener("click", toggleUiElement.bind(btnClose, uiElm));
}

function makeElementDraggable (elmnt) {
	if (!elmnt) {
		throw new Error("Element is undefined.");
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
		header = elmnt.querySelector(".heading");
	}
	if (header) {
		// if present, the header is where you move the DIV from:
		header.addEventListener("mousedown", dragMouseDown);
	} else {
		// otherwise, move the DIV from anywhere inside the DIV:
		elmnt.addEventListener("mousedown", dragMouseDown);
	}
}

async function showMenu(event) {
	const target = event.target;
	const targetId = target.id;
	const menuElm = document.getElementById(targetId + "-contextmenu");
	menuElm.style.display = "block";
	const offsets = target.getBoundingClientRect();
	menuElm.style.left = offsets.left + "px";
	menuElm.style.top = offsets.bottom + "px";
	// asyncDelay is to allow document to process current click event.
	await _.asyncDelay(1);
	const hideMenu = (e) => {
		if (e.target === target) {
			document.addEventListener("click", hideMenu, { once: true });
			return;
		}
		menuElm.style.display = "none";
	};
	document.addEventListener("click", hideMenu, { once: true });
}

function toggleUiElement(uiElm) {
	if (uiElm.style.display === "none") {
		uiElm.style.display = "block";
		//events.emit("onToggleUi", uiElm);
		return;
	}
	uiElm.style.display = "none";
}
