System.register([], function(exports_1) {
    var PathObserver;
    return {
        setters:[],
        execute: function() {
            PathObserver = (function () {
                function PathObserver(observerLocator, subject, path) {
                    this.observerLocator = observerLocator;
                    this.path = path.split('.');
                    this.subject = subject;
                    this.observers = [];
                    this.callbacks = [];
                    if (this.path.length > 1)
                        this.observeParts();
                    //TODO: this should be replaced with reuse of the Binding system
                }
                PathObserver.prototype.observeParts = function (propertyName) {
                    var _this = this;
                    //remove old chain until an observer returns non-null
                    if (propertyName !== undefined && propertyName !== null) {
                        for (var i = this.observers.length - 1; i >= 0; i--) {
                            var currentObserver = this.observers[i];
                            if (currentObserver.propertyName === propertyName) {
                                break;
                            }
                            var observer = this.observers.pop();
                            if (observer && observer.subscription) {
                                //cleanup
                                observer.subscription();
                            }
                        }
                    }
                    var currentSubject = this.subject;
                    //add new observers
                    var observersAreComplete = this.observers.length === this.path.length;
                    for (var i = 0; i < this.path.length; i++) {
                        var observer = this.observers[i];
                        if (!observer) {
                            var currentPath = this.path[i];
                            observer = this.observerLocator.getObserver(currentSubject, currentPath);
                            this.observers.push(observer);
                            var subscription = observer.subscribe(function (newValue, oldValue) {
                                _this.observeParts(observer.propertyName);
                            });
                            observer.subscription = subscription;
                        }
                        var currentValue = observer.getValue();
                        if (currentValue === undefined || currentValue === null) {
                            break;
                        }
                        else {
                            currentSubject = currentValue;
                        }
                    }
                    //if the last observer is the real one
                    if (!observersAreComplete && this.observers.length === this.path.length) {
                        var actualObserver = this.observers[this.observers.length - 1];
                        for (var i = 0; i < this.callbacks.length; i++) {
                            //TODO proper cleanup of callbacks!
                            actualObserver.subscribe(this.callbacks[i]);
                        }
                    }
                };
                PathObserver.prototype.observePart = function (part) {
                    if (part !== this.path[this.path.length - 1]) {
                        this.observeParts();
                    }
                };
                PathObserver.prototype.getObserver = function () {
                    if (this.path.length == 1) {
                        var resolve = this.subject[this.path[0]]; //binding issue with @bindable properties, see: https://github.com/aurelia/binding/issues/89
                        return this.observerLocator.getObserver(this.subject, this.path[0]);
                    }
                    return this;
                };
                PathObserver.prototype.getValue = function () {
                    //Verify that all observers are current.
                    var expectedSubject = this.subject;
                    for (var i = 0; this.path.length; i++) {
                        var currentObserver = this.observers[i];
                        if (currentObserver === null || currentObserver === undefined) {
                            this.observeParts(this.path[i]);
                            currentObserver = this.observers[i];
                            if (currentObserver === null || currentObserver === undefined) {
                                break;
                            }
                        }
                        if (currentObserver.obj !== expectedSubject) 
                        //Happens if you set a value somewhere along the binding path and immediately call getValue (on the very last observer)
                        {
                            this.observeParts(this.path[i - 1]);
                            break;
                        }
                        expectedSubject = currentObserver.getValue();
                    }
                    if (this.observers.length !== this.path.length)
                        return undefined; //Something along the binding path returned null/undefined
                    var value = this.observers[this.observers.length - 1].getValue();
                    return value;
                };
                PathObserver.prototype.subscribe = function (callback) {
                    this.callbacks.unshift(callback);
                    if (this.observers.length === this.path.length) {
                        return this.observers[this.observers.length - 1].subscribe(callback);
                    }
                    //TODO proper cleanup of callbacks
                };
                return PathObserver;
            })();
            exports_1("PathObserver", PathObserver);
        }
    }
});
