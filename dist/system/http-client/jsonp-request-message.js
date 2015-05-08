System.register(['./headers', './request-message-processor', './transformers'], function(exports_1) {
    var headers_1, request_message_processor_1, transformers_1;
    var JSONPRequestMessage, JSONPXHR;
    function createJSONPRequestMessageProcessor() {
        return new request_message_processor_1.RequestMessageProcessor(JSONPXHR, [
            transformers_1.timeoutTransformer,
            transformers_1.callbackParameterNameTransformer
        ]);
    }
    exports_1("createJSONPRequestMessageProcessor", createJSONPRequestMessageProcessor);
    return {
        setters:[
            function (_headers_1) {
                headers_1 = _headers_1;
            },
            function (_request_message_processor_1) {
                request_message_processor_1 = _request_message_processor_1;
            },
            function (_transformers_1) {
                transformers_1 = _transformers_1;
            }],
        execute: function() {
            JSONPRequestMessage = (function () {
                function JSONPRequestMessage(uri, callbackParameterName) {
                    this.method = 'JSONP';
                    this.uri = uri;
                    this.content = undefined;
                    this.headers = new headers_1.Headers();
                    this.responseType = 'jsonp';
                    this.callbackParameterName = callbackParameterName;
                }
                return JSONPRequestMessage;
            })();
            exports_1("JSONPRequestMessage", JSONPRequestMessage);
            JSONPXHR = (function () {
                function JSONPXHR() {
                }
                JSONPXHR.prototype.open = function (method, uri) {
                    this.method = method;
                    this.uri = uri;
                    this.callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
                };
                JSONPXHR.prototype.send = function () {
                    var _this = this;
                    var uri = this.uri + (this.uri.indexOf('?') >= 0 ? '&' : '?') + this.callbackParameterName + '=' + this.callbackName;
                    window[this.callbackName] = function (data) {
                        delete window[_this.callbackName];
                        document.body.removeChild(script);
                        if (_this.status === undefined) {
                            _this.status = 200;
                            _this.statusText = 'OK';
                            _this.response = data;
                            _this.onload(_this);
                        }
                    };
                    var script = document.createElement('script');
                    script.src = uri;
                    document.body.appendChild(script);
                    if (this.timeout !== undefined) {
                        setTimeout(function () {
                            if (_this.status === undefined) {
                                _this.status = 0;
                                _this.ontimeout(new Error('timeout'));
                            }
                        }, this.timeout);
                    }
                };
                JSONPXHR.prototype.abort = function () {
                    if (this.status === undefined) {
                        this.status = 0;
                        this.onabort(new Error('abort'));
                    }
                };
                JSONPXHR.prototype.setRequestHeader = function () { };
                return JSONPXHR;
            })();
        }
    }
});
