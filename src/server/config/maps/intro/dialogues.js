module.exports = {
	banddo: {
		1: {
			msg: [{
				msg: "le maudit chauffeur d\'autobus"
				, options: [1.1, 1.2]
			}]
			, options: {
				1.1: {
					msg: "Quel chauffeur d\'autobus?"
					, goto: 2
				}
				, 1.2: {
					msg: "on es ou?"
					, goto: 3
				}
			}
		},
		2: {
			msg: [{
				msg: "lui qui es la bas"
				, options: [2.1, 2.2]
			}]
			, options: {
				2.1: {
					msg: "Que-ce qui ce passe?"
					, goto: 4
				}
				, 2.2: {
					msg: "on es ou?"
					, goto: 3
				}
			}
		},
		3: {
				msg: [{
					msg: "ici on es dans le néant ca ce voit pas? regarde la-bas y'a rien"
					, options: [3.1, 3.2]
				}]
				, options: {
					3.1: {
						msg: "Que-ce qui ce passe avec le chauffeur?"
						, goto: 4
					}
					, 3.2: {
						msg: "on es ou?"
						, goto: 2
					}
				}
		},
		4: {
			msg: [{
				msg: "je comprend jammais ses jokes car je m\'assoie toujours en arrière avec les vrais"
				, options: [4.1,4.2]
			}]
			, options: {
				4.1: {
					msg: "c\'est pour ca tu fait du pouce ?"
					, goto: 3
				}
				4.2: {
					msg: "on es ou?"
					, goto: 3
				}
			}
		}
	}
};
