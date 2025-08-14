module.exports = {
	"Banddo": {
		1: {
			msg: [{
				msg: "Hey Salut ca fait longtemps que jai pas vue personne dans le néant!"
				, options: [1.1]
			}]
			, options: {
				1.1: {
					msg: "Pourquoi ya rien?"
					, goto: 2
				}

			}
		}
		, 2: {
			msg: [{
				msg: "Ya rien parce qu'on es dans le néant Comme dans rien pentoute!!!"
				, options: [2.1]
			}]
			, options: {
				2.1: {
					msg: "Tas bin raison!"
					, goto: 1
				}

			}
		}
	}	
};
