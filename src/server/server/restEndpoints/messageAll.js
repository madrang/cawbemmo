const messageAll = async (req, res) => {
	if (!req.query.msg || typeof req.query.msg !== "string") {
		return res.status(401).json({ message: "Not successful", error: err.message });
	}
	cons.emit("event", {
		event: "onGetMessages"
		, data: {
			messages: [{
				class: "color-blueA"
				, message: config.msg
				, type: "chat"
			}]
		}
	});
	res.jsonp({
		success: true
	});
};

module.exports = {
	level: 9
	, get: messageAll
};
