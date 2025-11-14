import client from "/js/system/client.js";

export default {
	clientConfig: null

	, async init () {
		this.clientConfig = await client.moduleProxy.clientConfig.getClientConfig();
	}
};
