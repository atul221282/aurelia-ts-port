System.register([], function(exports_1) {
    var hasObjectObserve, hasArrayObserve;
    return {
        setters:[],
        execute: function() {
            exports_1("hasObjectObserve", hasObjectObserve = (function detectObjectObserve() {
                if (typeof Object.observe !== 'function') {
                    return false;
                }
                var records = [];
                function callback(recs) {
                    records = recs;
                }
                var test = {};
                Object.observe(test, callback);
                test.id = 1;
                test.id = 2;
                delete test.id;
                Object.deliverChangeRecords(callback);
                if (records.length !== 3)
                    return false;
                if (records[0].type != 'add' ||
                    records[1].type != 'update' ||
                    records[2].type != 'delete') {
                    return false;
                }
                Object.unobserve(test, callback);
                return true;
            })());
            exports_1("hasArrayObserve", hasArrayObserve = (function detectArrayObserve() {
                if (typeof Array.observe !== 'function') {
                    return false;
                }
                var records = [];
                function callback(recs) {
                    records = recs;
                }
                var arr = [];
                Array.observe(arr, callback);
                arr.push(1, 2);
                arr.length = 0;
                Object.deliverChangeRecords(callback);
                if (records.length !== 2)
                    return false;
                if (records[0].type != 'splice' ||
                    records[1].type != 'splice') {
                    return false;
                }
                Array.unobserve(arr, callback);
                return true;
            })());
        }
    }
});
