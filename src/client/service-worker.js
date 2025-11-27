/* eslint-disable no-console */

const OFFLINE_VERSION = "v1.0";

const CACHE_NAME = "offline";

const OFFLINE_URL = "/offline.html";
const OFFLINE_RESSOURCES = [
	OFFLINE_URL
];

const onInstall = async (installEvent) => {
	const cache = await caches.open(CACHE_NAME);
	const reqOptions = {
		// Ensures that the response isn't fulfilled from cache.
		cache: "reload"
	};
	await cache.addAll(
		OFFLINE_RESSOURCES.map((ressourceUrl) => new Request(ressourceUrl, reqOptions))
	);
};
self.addEventListener("install", (installEvent) => {
	console.log("Installing ServiceWorker %s", OFFLINE_VERSION);

	const p = onInstall(installEvent);
	installEvent.waitUntil(p);

	// Force the waiting service worker to become the active service worker.
	self.skipWaiting();
});

const onActivate = async (activateEvent) => {
	if ("navigationPreload" in self.registration) { // Enable navigation preload if it's supported.
		await self.registration.navigationPreload.enable();
	}
};
self.addEventListener("activate", (activateEvent) => {
	console.log("Activating ServiceWorker %s", OFFLINE_VERSION);

	const p = onActivate(activateEvent);
	activateEvent.waitUntil(p);

	// Tell the active service worker to take control of the page immediately.
	self.clients.claim();
});

const fetchHandlers = {
	navigate: async (fetchEvent) => {
		try {
			const preloadResponse = await fetchEvent.preloadResponse;
			if (preloadResponse) {
				return preloadResponse;
			}

			// Always try the network first.
			const networkResponse = await fetch(fetchEvent.request);
			return networkResponse;
		} catch (error) {
			console.log("Fetch failed; returning offline page instead.\nError: %o", error);

			const cache = await caches.open(CACHE_NAME);
			const cachedResponse = await cache.match(OFFLINE_URL);
			return cachedResponse;
		}
	}
};
self.addEventListener("fetch", (fetchEvent) => {
	const handler = fetchHandlers[fetchEvent.request.mode];
	if (handler) {
		const p = handler(fetchEvent);
		fetchEvent.respondWith(p);
	}
});
