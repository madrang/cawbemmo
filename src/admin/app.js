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

async function showMenu(event) {
	const targetId = event.target.id;
	const menuElm = document.getElementById(targetId + "-contextmenu");
	menuElm.style.display = "block";
	const offsets = event.target.getBoundingClientRect();
	menuElm.style.left = offsets.left + "px";
	menuElm.style.top = offsets.bottom + "px";
	// asyncDelay is to allow document to process current click event.
	await _.asyncDelay(1);
	const hideMenu = (e) => {
		menuElm.style.display = "none";
	};
	document.addEventListener("click", hideMenu, { once: true });
}
