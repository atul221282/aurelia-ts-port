System.register([], function(exports_1) {
    var ChildRouter;
    return {
        setters:[],
        execute: function() {
            ChildRouter = (function () {
                function ChildRouter() {
                }
                ChildRouter.prototype.configureRouter = function (config, router) {
                    this.router = router;
                    config.map([
                        { route: ['', 'welcome'], moduleId: './welcome', nav: true, title: 'Welcome' },
                        { route: 'flickr', moduleId: './flickr', nav: true },
                        { route: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' }
                    ]);
                };
                return ChildRouter;
            })();
            exports_1("ChildRouter", ChildRouter);
        }
    }
});
