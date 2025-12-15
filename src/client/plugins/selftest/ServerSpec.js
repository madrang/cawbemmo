describe("Server", () => {
	let client;
	beforeAll(async () => {
		const module = await import("/js/system/client.js");
		client = module.default;
	}, 60 * 1000);
	describe("when ready", () => {
		beforeAll(async () => {
			await client.init();
		});
		it("has connected websocket", () => {
			expect(client.socket.connected).toBeTrue();
		});
	});
});
