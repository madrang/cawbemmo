const { routerConfig: { allowed, secondaryAllowed, globalAllowed, allowTargetId } } = require('./routerConfig');

module.exports = {
	allowedCpn: function (msg) {
		const { cpn, method, data: { cpn: secondaryCpn, method: secondaryMethod, targetId } } = msg;

		const valid = allowed[cpn] && allowed[cpn].includes(method);
		if (!valid)
			return false;

		if (!secondaryCpn)
			return true;

		const secondaryValid = secondaryAllowed?.[secondaryCpn]?.includes(secondaryMethod);
		if (!secondaryValid)
			return false;

		if (targetId !== undefined) {
			const canHaveTargetId = allowTargetId?.[secondaryCpn]?.includes(secondaryMethod);
			if (!canHaveTargetId)
				return false;
		}

		return true;
	},

	allowedGlobal: function (msg) {
		const result = globalAllowed[msg.module] && globalAllowed[msg.module].includes(msg.method);

		return result;
	},

	allowedGlobalCall: function (threadModule, method) {
		const result = globalAllowed[threadModule] && globalAllowed[threadModule].includes(method);

		return result;
	}
};
