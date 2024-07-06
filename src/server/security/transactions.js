let lastId = 0;
const list = [];

const SLEEP_DELAY = 10;

const complete = (id) => {
	list.spliceWhere((l) => l === id);
};

const register = () => {
	const nextId = ++lastId;
	list.push(nextId);
	return complete.bind(null, nextId);
};

const whenEmpty = (resolve) => {
	if (list.length > 0) {
		setTimeout(whenEmpty, SLEEP_DELAY, resolve);
	} else {
		resolve();
	}
};

module.exports = {
	register
	, returnWhenDone: () => (list.length > 0
		? new Promise((res) => setTimeout(whenEmpty, SLEEP_DELAY, res))
		: Promise.resolve()
	)
};
