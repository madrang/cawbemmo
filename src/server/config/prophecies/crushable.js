module.exports = {
	type: 'crushable',

	init: function () {

	},

	simplify: function () {
		return this.type;
	},

	events: {
		beforeTakeDamage: function ({ damage }) {
			damage.amount *= 4;
		}
	}
};
