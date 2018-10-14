(function() {
	var url = window.location;
	var retries = 0;
	var ws;
	function setupWebSocket() {
		console.log("Setting up reloader websocket.");
		ws = new WebSocket("ws://" + url.host + "/api/reloadws");
		ws.onmessage = function () {
			location.reload();
		}
		ws.onerror = function () {
			console.log("Lost connection to server.");
			if (retries < 5) {
				setupWebSocket();
				retries++;
			}
		}
		ws.onclose = function () {
			console.log("Lost connection to server.");
			if (retries < 5) {
				setupWebSocket();
				retries++;
			}
		}
		ws.onopen = function () {
			ping();
		}
	}

	function ping () {
		if (ws.readyState == 1) {
			ws.send("ping");
			setTimeout(ping, 5000);
		} else console.log("Can't reach server.");
	}
	setupWebSocket();
})();
