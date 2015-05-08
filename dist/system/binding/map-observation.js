var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};System.register(['./collection-observation'], function(exports_1) {
    var collection_observation_1;
    var mapProto, ModifyMapObserver;
    function getMapObserver(taskQueue, map) {
        return ModifyMapObserver.create(taskQueue, map);
    }
    exports_1("getMapObserver", getMapObserver);
    return {
        setters:[
            function (_collection_observation_1) {
                collection_observation_1 = _collection_observation_1;
            }],
        execute: function() {
            mapProto = Map.prototype;
            ModifyMapObserver = (function (_super) {
                __extends(ModifyMapObserver, _super);
                function ModifyMapObserver(taskQueue, map) {
                    _super.call(this, taskQueue, map);
                }
                ModifyMapObserver.create = function (taskQueue, map) {
                    var observer = new ModifyMapObserver(taskQueue, map);
                    map['set'] = function () {
                        var oldValue = map.get(arguments[0]);
                        var type = oldValue ? 'update' : 'add';
                        var methodCallResult = mapProto['set'].apply(map, arguments);
                        observer.addChangeRecord({
                            type: type,
                            object: map,
                            key: arguments[0],
                            oldValue: oldValue
                        });
                        return methodCallResult;
                    };
                    map['delete'] = function () {
                        var oldValue = map.get(arguments[0]);
                        var methodCallResult = mapProto['delete'].apply(map, arguments);
                        observer.addChangeRecord({
                            type: 'delete',
                            object: map,
                            key: arguments[0],
                            oldValue: oldValue
                        });
                        return methodCallResult;
                    };
                    map['clear'] = function () {
                        var methodCallResult = mapProto['clear'].apply(map, arguments);
                        observer.addChangeRecord({
                            type: 'clear',
                            object: map
                        });
                        return methodCallResult;
                    };
                    return observer;
                };
                return ModifyMapObserver;
            })(collection_observation_1.ModifyCollectionObserver);
        }
    }
});
