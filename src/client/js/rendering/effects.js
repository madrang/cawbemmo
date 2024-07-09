define([

], function (

) {
	return {
		list: []

		, register: function (cpn) {
			this.list.push(cpn);
		}

		, unregister: function (cpn) {
			this.list.spliceWhere((l) => l === cpn);
		}

		, render: function () {
			const list = this.list;
			for (let i = list.length - 1; i >= 0; --i) {
				let l = list[i];
				if (l.destroyed || !l.obj || l.obj.destroyed) {
					if (!l.destroyManual || !l.destroyManual()) {
						list.splice(i, 1);
						continue;
					}
				}
				l.renderManual();
			}
		}
	};
});
