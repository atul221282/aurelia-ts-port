System.register(['./navigation-plan'], function(exports_1) {
    var navigation_plan_1;
    var NavigationContext, CommitChangesStep;
    return {
        setters:[
            function (_navigation_plan_1) {
                navigation_plan_1 = _navigation_plan_1;
            }],
        execute: function() {
            NavigationContext = (function () {
                function NavigationContext(router, nextInstruction) {
                    this.router = router;
                    this.nextInstruction = nextInstruction;
                    this.currentInstruction = router.currentInstruction;
                    this.prevInstruction = router.currentInstruction;
                }
                NavigationContext.prototype.getAllContexts = function (acc) {
                    if (acc === void 0) { acc = []; }
                    acc.push(this);
                    if (this.plan) {
                        for (var key in this.plan) {
                            this.plan[key].childNavigationContext && this.plan[key].childNavigationContext.getAllContexts(acc);
                        }
                    }
                    return acc;
                };
                Object.defineProperty(NavigationContext.prototype, "nextInstructions", {
                    get: function () {
                        return this.getAllContexts().map(function (c) { return c.nextInstruction; }).filter(function (c) { return c; });
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(NavigationContext.prototype, "currentInstructions", {
                    get: function () {
                        return this.getAllContexts().map(function (c) { return c.currentInstruction; }).filter(function (c) { return c; });
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(NavigationContext.prototype, "prevInstructions", {
                    get: function () {
                        return this.getAllContexts().map(function (c) { return c.prevInstruction; }).filter(function (c) { return c; });
                    },
                    enumerable: true,
                    configurable: true
                });
                NavigationContext.prototype.commitChanges = function (waitToSwap) {
                    var next = this.nextInstruction, prev = this.prevInstruction, viewPortInstructions = next.viewPortInstructions, router = this.router, loads = [], delaySwaps = [];
                    router.currentInstruction = next;
                    if (prev) {
                        prev.config.navModel.isActive = false;
                    }
                    next.config.navModel.isActive = true;
                    router.refreshBaseUrl();
                    router.refreshNavigation();
                    for (var viewPortName in viewPortInstructions) {
                        var viewPortInstruction = viewPortInstructions[viewPortName];
                        var viewPort = router.viewPorts[viewPortName];
                        if (!viewPort) {
                            throw new Error("There was no router-view found in the view for " + viewPortInstruction.moduleId + ".");
                        }
                        if (viewPortInstruction.strategy === navigation_plan_1.activationStrategy.replace) {
                            if (waitToSwap) {
                                delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
                            }
                            loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(function (x) {
                                if ('childNavigationContext' in viewPortInstruction) {
                                    return viewPortInstruction.childNavigationContext.commitChanges();
                                }
                            }));
                        }
                        else {
                            if ('childNavigationContext' in viewPortInstruction) {
                                loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
                            }
                        }
                    }
                    return Promise.all(loads).then(function () {
                        delaySwaps.forEach(function (x) { return x.viewPort.swap(x.viewPortInstruction); });
                    });
                };
                NavigationContext.prototype.updateTitle = function () {
                    var title = this.buildTitle();
                    if (title) {
                        document.title = title;
                    }
                };
                NavigationContext.prototype.buildTitle = function (separator) {
                    if (separator === void 0) { separator = ' | '; }
                    var next = this.nextInstruction, title = next.config.navModel.title || '', viewPortInstructions = next.viewPortInstructions, childTitles = [];
                    for (var viewPortName in viewPortInstructions) {
                        var viewPortInstruction = viewPortInstructions[viewPortName];
                        if ('childNavigationContext' in viewPortInstruction) {
                            var childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
                            if (childTitle) {
                                childTitles.push(childTitle);
                            }
                        }
                    }
                    if (childTitles.length) {
                        title = childTitles.join(separator) + (title ? separator : '') + title;
                    }
                    if (this.router.title) {
                        title += (title ? separator : '') + this.router.title;
                    }
                    return title;
                };
                return NavigationContext;
            })();
            exports_1("NavigationContext", NavigationContext);
            CommitChangesStep = (function () {
                function CommitChangesStep() {
                }
                CommitChangesStep.prototype.run = function (navigationContext, next) {
                    return navigationContext.commitChanges(true).then(function () {
                        navigationContext.updateTitle();
                        return next();
                    });
                };
                return CommitChangesStep;
            })();
            exports_1("CommitChangesStep", CommitChangesStep);
        }
    }
});
