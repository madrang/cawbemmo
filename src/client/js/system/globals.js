define([
	"js/system/client"
], (
	client
) => {
	return {
		clientConfig: null

		, async init () {
			this.clientConfig = await client.moduleProxy.clientConfig.getClientConfig();
		}
	};
});
