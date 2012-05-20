/*
 * https://github.com/stpe/jquery-liveupdatelist
 */
(function($){
	$.fn.liveUpdateList = function(options) {

		var live = (function() {
			var queue = [],
			latestData = null,
			params = null,
			options = {},
			current = [],
			timer = null,

			update = function() {
				if (queue.length == 0) {
					return;
				}

				var item = queue.pop();

				// move off item exceeding limit		
				removeLastElement(function() {
					addElement(item);
				});
			},

			addElement = function(item) {
				if (options.parse) {
					item = options.parse.call(this, item);
				}

				item._element = $(item.content);

				// animate fall down effect
				item._element.css('margin-top', -999).prependTo(options.target);
				var height = item._element.outerHeight();
				item._element.css('margin-top', -height).animate({"margin-top": 0}, 250);

				current.unshift(item);
			},

			removeLastElement = function(callback) {
				if (current.length <= options.max) {
					callback.call();
					return;
				}

				var item = current.pop();
				item._element
					.fadeOut("fast", function() {
						$(this).remove();
						callback.call();
					});
			},

			poll = function() {
				function pollCallback(data) {
					latestData = data;

					$.each(data, function(key, item) {						
						queue.push(item);
					});

					if (timer) {
						clearInterval(timer);
						timer = null;
					}

					if (data && data.length > 0) {
						timer = setInterval(
							update,
							Math.floor(options.interval / (data.length + 1))
						);
					}
				}

				// parameters to be appended to URL
				if (typeof options.params == "object") {
					if (latestData && latestData.length > 0) {
						params = {};
					
						// check data for given data parameter
						if (!latestData[0][options.params.data]) {
							console.log("Error! Data does not contain property '" + options.params.data + "':", latestData[0]);
						} else {
							params[options.params.callback] = latestData[0][options.params.data];
						}		
					}
				} else if (typeof options.params == "function") {
					// user function
					params = options.params.call(this, latestData, params);
				}

				$.getJSON(
					options.url,
					params,
					pollCallback
				);
			};

			return {
				init: function(userOptions) {
					options = userOptions;
					poll(); // force first
					setInterval(poll, options.interval);
				}
			};
		})();

		options.target = this;
		live.init(
			// extend default options
			$.extend({
				"interval": 10000,
				"parse": false,
				"max": 10,
				"params": { callback: "id", data: "id" }
			}, options)
		);

		// maintain chainability
		return this;
	};
})(jQuery);
