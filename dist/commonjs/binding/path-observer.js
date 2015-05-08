var PathObserver = (function () {
    function PathObserver(leftObserver, getRightObserver, value) {
        var _this = this;
        this.leftObserver = leftObserver;
        this.disposeLeft = leftObserver.subscribe(function (newValue) {
            var newRightValue = _this.updateRight(getRightObserver(newValue));
            _this.notify(newRightValue);
        });
        this.updateRight(getRightObserver(value));
    }
    PathObserver.prototype.updateRight = function (observer) {
        var _this = this;
        this.rightObserver = observer;
        if (this.disposeRight) {
            this.disposeRight();
        }
        if (!observer) {
            return null;
        }
        this.disposeRight = observer.subscribe(function (newValue) { return _this.notify(newValue); });
        return observer.getValue();
    };
    PathObserver.prototype.subscribe = function (callback) {
        var that = this;
        that.callback = callback;
        return function () {
            that.callback = null;
        };
    };
    PathObserver.prototype.notify = function (newValue) {
        var callback = this.callback;
        if (callback) {
            callback(newValue);
        }
    };
    PathObserver.prototype.dispose = function () {
        if (this.disposeLeft) {
            this.disposeLeft();
        }
        if (this.disposeRight) {
            this.disposeRight();
        }
    };
    return PathObserver;
})();
exports.PathObserver = PathObserver;
