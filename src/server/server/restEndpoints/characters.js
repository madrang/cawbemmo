module.exports = {
	get: async (req, res) => {
		let charactersList = await io.getAllAsync({
			table: "character"
			, isArray: true
			, clean: true
		});
		/*
		characterList = (await io.getAllAsync({
			table: "characterList"
			, isArray: true
		})).reduce((table, entry) => {
			table[entry.key] = entry.value;
			return table;
		}, {});
		*/
		res.json(charactersList);
	}
};
