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
			first = true,

			update = function() {
				if (queue.length == 0) {
					return;
				}

				var item = queue.pop();

				// move off item exceeding limit		
				removeLastElement(function() {
					// when last item is gone, add next
					addElement(item);
				});
			},

			addElement = function(item) {
				// invoke user provided item parser if exists
				if (options.parseItem) {
					item = options.parseItem.call(this, item);
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

				// apply fade out effect to last item
				var item = current.pop();
				item._element
					.fadeOut("fast", function() {
						$(this).remove();
						callback.call();
					});
			},

			poll = function() {
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
					function(data) {
						// invoke user provided data parser if exists
						if (options.parseData) {
							data = options.parseData.call(this, data);
						}
	
						// if first request, only display options.max items
						if (first) {
							data = data.slice(0, options.max);
							first = false;
						}
	
						latestData = data;
	
						// push new items on the queue
						$.each(data, function(key, item) {						
							queue.push(item);
						});
	
						// clear existing timer
						if (timer) {
							clearInterval(timer);
							timer = null;
						}
	
						// create new timer if there is data
						if (data && data.length > 0) {
							timer = setInterval(
								update,
								Math.floor(options.interval / (data.length + 1))
							);
						}
					}
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
