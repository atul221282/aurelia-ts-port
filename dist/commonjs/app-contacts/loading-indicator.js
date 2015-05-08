var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var nprogress_1 = require('nprogress');
var aurelia_framework_1 = require('aurelia-framework');
var LoadingIndicator = (function () {
    function LoadingIndicator() {
        this.loading = false;
    }
    LoadingIndicator.prototype.loadingChanged = function (newValue) {
        if (newValue) {
            nprogress_1.default.start();
        }
        else {
            nprogress_1.default.done();
        }
    };
    __decorate([
        aurelia_framework_1.bindable, 
        __metadata('design:type', Object)
    ], LoadingIndicator.prototype, "loading");
    LoadingIndicator = __decorate([
        aurelia_framework_1.noView, 
        __metadata('design:paramtypes', [])
    ], LoadingIndicator);
    return LoadingIndicator;
})();
exports.LoadingIndicator = LoadingIndicator;
