(function(window) {

	var KEY_TARGET = 'mimic_target';

	var mimic = window.mimic = {},
		session = window.sessionStorage,
		connection = null,
		listeners = {},
		promises = {};

	function connect(force) {

		if (connection) {
			if (!force) {
				return;
			}

			connection.close();
		}

		var target = session[KEY_TARGET];
		connection = new WebSocket(target);

		connection.onmessage = function(event) {
			var data = event && event.data && event.data.split('|');
			if (data && data.length === 4) {
				mimic.setItem(data[1], data[2]);
			}
		};

	}

	window.addEventListener("storage", function(event) {
		var key = event.key;
		var val_old = event.oldValue;
		var val_new = event.newValue;

		if (val_new === val_old) {
			// No changes.
			return;
		}

		if (key === KEY_TARGET) {
			connect(true);
			return;
		}

		var time = Date.now();
		connection.send(time + '|' + key + '|' + val_new + '|' + val_old);

		var value = mimic.getItem(key);

		for (var listenerList in listeners) {

			if (!listeners.hasOwnProperty(listenerList)) {
				continue;
			}

			for (var listener in listenerList) {
				listener(event, value);
			}

		}

	}, false);

	// If the page has been refreshed, re-establish the last connection.
	if (session[KEY_TARGET]) {
		connect(false);
	}

	/**
	 * Creates an accessor function to get the relevant promise for a given data key.
	 * @param {String} key The key to look for the promise under.
	 * @returns {Function} The accessor function.
	 */
	mimic.getPromiseAccessor = function(key) {
		return function() {
			return promises[key];
		}
	};

	/**
	 * Constructs an object from the stored key-value pairs in the session.
	 * @param {String} key The key to look for data under.
	 * @returns {Object} The object constructed from the data, or undefined if the key doesn't resolve.
	 */
	mimic.getItem = function(key) {
		var root = session[key];

		// If the object couldn't be found.
		if (typeof(root) === 'undefined' || root === null) {
			return root;
		}

		if (isBounded(root, '[', ']')) {
			return spliterate([], key, root, function(list, itemValue) {
				list.push(itemValue);
			});
		}

		if (isBounded(root, '{', '}')) {
			return spliterate({}, key, root, function(map, itemValue, itemKey) {
				map[itemKey] = itemValue;
			});
		}

		// root object is nothing special.
		return root;

	};

	function isBounded(string, leftBound, rightBound) {
		return string.indexOf(leftBound) === 0 && string.indexOf(rightBound) === string.length - 1;
	}

	function spliterate(target, rootKey, string, callback) {
		for (var subKey in string.substring(1, string.length - 2).split(',')) {
			callback(target, mimic.getItem(rootKey + '.' + subKey), subKey);
		}

		return target;
	}

	/**
	 * Deconstructs the given object into key-value pairs, and stores them in the session.
	 * @param {String} key The key to use as the root.
	 * @param {Object} value The object to deconstruct and store.
	 */
	mimic.setItem = function(key, value) {
		//
	};

	/**
	 *
	 * @param key The data to watch for changes on.
	 * @param callback A callback function for when the value changes.
	 * @returns {Function} The accessor function for the relevant promise.
	 */
	mimic.watch = function(key, callback) {
		listeners[key] || ( listeners[key] = [] ).push(callback);
		return mimic.getPromiseAccessor(key);
	}

})(window);
