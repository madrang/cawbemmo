define([
	'socket',
	'js/system/events'
], function (
	io,
	events
) {
	let client = {
		doneConnect: false,

		init: function (onReady) {
			this.socket = io({
				transports: ['websocket']
			});

			this.socket.on('connect', this.onConnected.bind(this, onReady));
			this.socket.on('handshake', this.onHandshake.bind(this));
			this.socket.on('event', this.onEvent.bind(this));
			this.socket.on('events', this.onEvents.bind(this));
			this.socket.on('dc', this.onDisconnect.bind(this));
		},
		onConnected: function (onReady) {
			if (this.doneConnect)
				this.onDisconnect();
			else
				this.doneConnect = true;

			if (onReady)
				onReady();
		},
		onDisconnect: function () {
			window.location = window.location;
		},
		onHandshake: function () {
			events.emit('onHandshake');
			this.socket.emit('handshake');
		},
		request: function (msg) {
			this.socket.emit('request', msg, msg.callback);
		},
		onEvent: function (response) {
			events.emit(response.event, response.data);
		},
		onEvents: function (response) {
			//If we get objects, self needs to be first
			// otherwise we might create the object (setting his position or attack animation)
			// before instantiating it
			let oList = response.onGetObject;
			if (oList) {
				let prepend = oList.filter(o => o.self);
				oList.spliceWhere(o => prepend.some(p => p === o));
				oList.unshift.apply(oList, prepend);
			}

			for (let e in response) {
				let r = response[e];

				//Certain messages expect to be performed last (because the object they act on hasn't been created when they get queued)
				r.sort(function (a, b) {
					if (a.performLast)
						return 1;
					else if (b.performLast)
						return -1;
					return 0;
				});

				r.forEach(function (o) {
					events.emit(e, o);
				});
			}
		}
	};

	return client;
});
