const sendObjToZone = require('../portal/sendObjToZone');

module.exports = (cpnSocial, targetZone) => {
	const { obj } = cpnSocial;

	sendObjToZone({
		obj,
		zoneName: targetZone
	});
};
