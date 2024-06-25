define([
	"js/system/browserStorage"
], function (
	browserStorage
) {
	const config = {
		showNames: true
		, showQuests: "on"
		, showEvents: true
		, playAudio: true
		, qualityIndicators: "off"
		, unusableIndicators: "off"
		, rememberChatChannel: true
		, soundVolume: 100
		, musicVolume: 100
		, partyView: "full"
		, damageNumbers: "element"
	};
	browserStorage.loadConfig("opt", config);

	const valueChains = {
		partyView: ["full", "compact", "minimal"]
		, showQuests: ["on", "minimal", "off"]
		, qualityIndicators: ["border", "bottom", "background", "off"]
		, unusableIndicators: ["off", "border", "top", "background"]
		, damageNumbers: ["element", "white", "off"]
	};
	const getNextValue = (key) => {
		const currentValue = config[key];
		const chain = valueChains[key];
		const currentIndex = chain.indexOf(currentValue);
		const nextValue = chain[(currentIndex + 1) % chain.length];
		return nextValue;
	};
	config.toggle = (key) => {
		if (valueChains[key]) {
			config[key] = getNextValue(key);
		} else {
			config[key] = !config[key];
		}
		browserStorage.set(config.getKeyName(key), config[key]);
	};

	return config;
});
