//Imports
const { messageAllThreads } = require("../../world/threadManager");

//Exports
module.exports = async (cpnSocial, eventName) => {
	messageAllThreads({
		threadModule: "eventManager"
		, method: "startEventByCode"
		, data: eventName
	});
};
