define(["require", "exports", '../http-client/index'], function (require, exports, _index) {
    var url = 'http://api.flickr.com/services/feeds/photos_public.gne?tags=rainier&tagmode=any&format=json';
    var Flickr = (function () {
        function Flickr(http) {
            this.heading = 'Flickr';
            this.images = [];
            this.http = http;
        }
        Flickr.inject = function () {
            return [
                _index.HttpClient
            ];
        };
        Flickr.prototype.activate = function () {
            var _this = this;
            return this.http.jsonp(url).then(function (response) {
                _this.images = response.content.items;
            });
        };
        Flickr.prototype.canDeactivate = function () {
            return confirm('Are you sure you want to leave?');
        };
        return Flickr;
    })();
    exports.Flickr = Flickr;
});
