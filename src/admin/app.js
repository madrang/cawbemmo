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
], function (
	glExport
) {
	fetch("/api/auth/self").then(async (res) => {
		if (res.status === 200) {
			return onConnected(await res.json());
		}
		_.log.AdminPanel.info("Not connected!");
		const loginElm = document.getElementById("login");
		loginElm.style.display = "flex";
	}, _.log.AdminPanel.error);
});

async function submitLoginForm(event) {
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

function onConnected(accountInfo) {
	_.log.submitLoginForm.info("Connected", accountInfo);

	const loginElm = document.getElementById("login");
	loginElm.style.display = "none";

	const userMenu = document.getElementById("user-menu");
	userMenu.innerText = accountInfo.username;

	for (const elmName of [ "top-menu", "ui-container" ]) {
		const elm = document.getElementById(elmName);
		elm.style.display = "block";
	}

	fetch("/api/rest/users").then(async (res) => {
		if (!res.ok) {
			_.log.getUsers.info("Request failed! Status:", res.statusText);
			return;
		}
		const users = await res.json();
		const container = document.getElementById("ui-container");
		for (const user of users) {
			const userElm = document.createElement("div");
			userElm.appendChild(document.createTextNode(JSON.stringify(user)));
			container.appendChild(userElm);
		}
	}, _.log.getUsers.error);
}

function showMenu(event) {
	const targetId = event.target.id;
	const menuElm = document.getElementById(targetId + "-contextmenu");
	menuElm.style.display = "block";
	const offsets = event.target.getBoundingClientRect();
	menuElm.style.left = offsets.left + "px";
	menuElm.style.top = offsets.bottom + "px";
}
