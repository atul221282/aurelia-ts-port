System.register([], function(exports_1) {
    var Handler, EventAggregator;
    function includeEventsIn(obj) {
        var ea = new EventAggregator();
        obj.subscribeOnce = function (event, callback) {
            return ea.subscribeOnce(event, callback);
        };
        obj.subscribe = function (event, callback) {
            return ea.subscribe(event, callback);
        };
        obj.publish = function (event, data) {
            ea.publish(event, data);
        };
        return ea;
    }
    exports_1("includeEventsIn", includeEventsIn);
    function configure(aurelia) {
        aurelia.withInstance(EventAggregator, includeEventsIn(aurelia));
    }
    exports_1("configure", configure);
    return {
        setters:[],
        execute: function() {
            Handler = (function () {
                function Handler(messageType, callback) {
                    this.messageType = messageType;
                    this.callback = callback;
                }
                Handler.prototype.handle = function (message) {
                    if (message instanceof this.messageType) {
                        this.callback.call(null, message);
                    }
                };
                return Handler;
            })();
            EventAggregator = (function () {
                function EventAggregator() {
                    this.eventLookup = {};
                    this.messageHandlers = [];
                }
                EventAggregator.prototype.publish = function (event, data) {
                    var subscribers, i;
                    if (typeof event === 'string') {
                        subscribers = this.eventLookup[event];
                        if (subscribers) {
                            subscribers = subscribers.slice();
                            i = subscribers.length;
                            while (i--) {
                                subscribers[i](data, event);
                            }
                        }
                    }
                    else {
                        subscribers = this.messageHandlers.slice();
                        i = subscribers.length;
                        while (i--) {
                            subscribers[i].handle(event);
                        }
                    }
                };
                EventAggregator.prototype.subscribe = function (event, callback) {
                    var subscribers, handler;
                    if (typeof event === 'string') {
                        subscribers = this.eventLookup[event] || (this.eventLookup[event] = []);
                        subscribers.push(callback);
                        return function () {
                            var idx = subscribers.indexOf(callback);
                            if (idx != -1) {
                                subscribers.splice(idx, 1);
                            }
                        };
                    }
                    else {
                        handler = new Handler(event, callback);
                        subscribers = this.messageHandlers;
                        subscribers.push(handler);
                        return function () {
                            var idx = subscribers.indexOf(handler);
                            if (idx != -1) {
                                subscribers.splice(idx, 1);
                            }
                        };
                    }
                };
                EventAggregator.prototype.subscribeOnce = function (event, callback) {
                    var sub = this.subscribe(event, function (data, event) {
                        sub();
                        return callback(data, event);
                    });
                    return sub;
                };
                return EventAggregator;
            })();
            exports_1("EventAggregator", EventAggregator);
        }
    }
});
