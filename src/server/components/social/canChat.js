// social/canChat
module.exports = (obj, time) => {
	const accountLevel = obj.auth.getAccountLevel();
	if (accountLevel >= 5) {
		return true;
	}
	if (!time) {
		time = Date.now();
	}
	const playerLevel = obj.level;
	const playedTime = obj.stats.stats.played * 1000;
	const sessionStart = obj.player.sessionStart;
	const sessionDelta = time - sessionStart;
	return (playerLevel >= 3 || playedTime + sessionDelta >= 180000);
};
