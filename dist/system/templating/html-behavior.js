System.register(['aurelia-metadata', 'aurelia-binding', 'aurelia-task-queue', './view-strategy', './view-engine', './content-selector', './util', './bindable-property', './behavior-instance'], function(exports_1) {
    var aurelia_metadata_1, aurelia_binding_1, aurelia_task_queue_1, view_strategy_1, view_engine_1, content_selector_1, util_1, bindable_property_1, behavior_instance_1;
    var defaultInstruction, contentSelectorFactoryOptions, hasShadowDOM, HtmlBehaviorResource;
    return {
        setters:[
            function (_aurelia_metadata_1) {
                aurelia_metadata_1 = _aurelia_metadata_1;
            },
            function (_aurelia_binding_1) {
                aurelia_binding_1 = _aurelia_binding_1;
            },
            function (_aurelia_task_queue_1) {
                aurelia_task_queue_1 = _aurelia_task_queue_1;
            },
            function (_view_strategy_1) {
                view_strategy_1 = _view_strategy_1;
            },
            function (_view_engine_1) {
                view_engine_1 = _view_engine_1;
            },
            function (_content_selector_1) {
                content_selector_1 = _content_selector_1;
            },
            function (_util_1) {
                util_1 = _util_1;
            },
            function (_bindable_property_1) {
                bindable_property_1 = _bindable_property_1;
            },
            function (_behavior_instance_1) {
                behavior_instance_1 = _behavior_instance_1;
            }],
        execute: function() {
            defaultInstruction = { suppressBind: false }, contentSelectorFactoryOptions = { suppressBind: true }, hasShadowDOM = !!HTMLElement.prototype.createShadowRoot;
            HtmlBehaviorResource = (function () {
                function HtmlBehaviorResource() {
                    this.elementName = null;
                    this.attributeName = null;
                    this.liftsContent = false;
                    this.targetShadowDOM = false;
                    this.skipContentProcessing = false;
                    this.usesShadowDOM = false;
                    this.childExpression = null;
                    this.hasDynamicOptions = false;
                    this.properties = [];
                    this.attributes = {};
                }
                HtmlBehaviorResource.convention = function (name, existing) {
                    var behavior;
                    if (name.endsWith('CustomAttribute')) {
                        behavior = existing || new HtmlBehaviorResource();
                        behavior.attributeName = util_1.hyphenate(name.substring(0, name.length - 15));
                    }
                    if (name.endsWith('CustomElement')) {
                        behavior = existing || new HtmlBehaviorResource();
                        behavior.elementName = util_1.hyphenate(name.substring(0, name.length - 13));
                    }
                    return behavior;
                };
                HtmlBehaviorResource.prototype.analyze = function (container, target) {
                    var proto = target.prototype, properties = this.properties, attributeName = this.attributeName, i, ii, current;
                    this.observerLocator = container.get(aurelia_binding_1.ObserverLocator);
                    this.taskQueue = container.get(aurelia_task_queue_1.TaskQueue);
                    this.target = target;
                    this.usesShadowDOM = this.targetShadowDOM && hasShadowDOM;
                    this.handlesCreated = ('created' in proto);
                    this.handlesBind = ('bind' in proto);
                    this.handlesUnbind = ('unbind' in proto);
                    this.handlesAttached = ('attached' in proto);
                    this.handlesDetached = ('detached' in proto);
                    this.apiName = (this.elementName || this.attributeName).replace(/-([a-z])/g, function (m, w) { return w.toUpperCase(); });
                    if (attributeName !== null) {
                        if (properties.length === 0) {
                            new bindable_property_1.BindableProperty({
                                name: 'value',
                                changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
                                attribute: attributeName
                            }).registerWith(target, this);
                        }
                        current = properties[0];
                        if (properties.length === 1 && current.name === 'value') {
                            current.isDynamic = current.hasOptions = this.hasDynamicOptions;
                            current.defineOn(target, this);
                        }
                        else {
                            for (i = 0, ii = properties.length; i < ii; ++i) {
                                properties[i].defineOn(target, this);
                            }
                            current = new bindable_property_1.BindableProperty({
                                name: 'value',
                                changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
                                attribute: attributeName
                            });
                            current.hasOptions = true;
                            current.registerWith(target, this);
                        }
                    }
                    else {
                        for (i = 0, ii = properties.length; i < ii; ++i) {
                            properties[i].defineOn(target, this);
                        }
                    }
                };
                HtmlBehaviorResource.prototype.load = function (container, target, viewStrategy, transientView) {
                    var _this = this;
                    var options;
                    if (this.elementName !== null) {
                        viewStrategy = viewStrategy || this.viewStrategy || view_strategy_1.ViewStrategy.getDefault(target);
                        options = {
                            targetShadowDOM: this.targetShadowDOM,
                            beforeCompile: target.beforeCompile
                        };
                        if (!viewStrategy.moduleId) {
                            viewStrategy.moduleId = aurelia_metadata_1.Origin.get(target).moduleId;
                        }
                        return viewStrategy.loadViewFactory(container.get(view_engine_1.ViewEngine), options).then(function (viewFactory) {
                            if (!transientView) {
                                _this.viewFactory = viewFactory;
                            }
                            return viewFactory;
                        });
                    }
                    return Promise.resolve(this);
                };
                HtmlBehaviorResource.prototype.register = function (registry, name) {
                    if (this.attributeName !== null) {
                        registry.registerAttribute(name || this.attributeName, this, this.attributeName);
                    }
                    if (this.elementName !== null) {
                        registry.registerElement(name || this.elementName, this);
                    }
                };
                HtmlBehaviorResource.prototype.compile = function (compiler, resources, node, instruction, parentNode) {
                    if (this.liftsContent) {
                        if (!instruction.viewFactory) {
                            var template = document.createElement('template'), fragment = document.createDocumentFragment(), part = node.getAttribute('part');
                            node.removeAttribute(instruction.originalAttrName);
                            if (node.parentNode) {
                                node.parentNode.replaceChild(template, node);
                            }
                            else if (window.ShadowDOMPolyfill) {
                                window.ShadowDOMPolyfill.unwrap(parentNode).replaceChild(window.ShadowDOMPolyfill.unwrap(template), window.ShadowDOMPolyfill.unwrap(node));
                            }
                            else {
                                parentNode.replaceChild(template, node);
                            }
                            fragment.appendChild(node);
                            instruction.viewFactory = compiler.compile(fragment, resources);
                            if (part) {
                                instruction.viewFactory.part = part;
                                node.removeAttribute('part');
                            }
                            node = template;
                        }
                    }
                    else if (this.elementName !== null) {
                        var partReplacements = {};
                        if (!this.skipContentProcessing && node.hasChildNodes()) {
                            if (!this.usesShadowDOM) {
                                var fragment = document.createDocumentFragment(), currentChild = node.firstChild, nextSibling;
                                while (currentChild) {
                                    nextSibling = currentChild.nextSibling;
                                    if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
                                        partReplacements[toReplace] = compiler.compile(currentChild, resources);
                                    }
                                    else {
                                        fragment.appendChild(currentChild);
                                    }
                                    currentChild = nextSibling;
                                }
                                instruction.contentFactory = compiler.compile(fragment, resources);
                            }
                            else {
                                var currentChild = node.firstChild, nextSibling, toReplace;
                                while (currentChild) {
                                    nextSibling = currentChild.nextSibling;
                                    if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
                                        partReplacements[toReplace] = compiler.compile(currentChild, resources);
                                    }
                                    currentChild = nextSibling;
                                }
                            }
                        }
                    }
                    instruction.partReplacements = partReplacements;
                    instruction.suppressBind = true;
                    return node;
                };
                HtmlBehaviorResource.prototype.create = function (container, instruction, element, bindings) {
                    if (instruction === void 0) { instruction = defaultInstruction; }
                    if (element === void 0) { element = null; }
                    if (bindings === void 0) { bindings = null; }
                    var executionContext = instruction.executionContext || container.get(this.target), behaviorInstance = new behavior_instance_1.BehaviorInstance(this, executionContext, instruction), viewFactory, host;
                    if (this.liftsContent) {
                        //template controller
                        element.primaryBehavior = behaviorInstance;
                    }
                    else if (this.elementName !== null) {
                        //custom element
                        viewFactory = instruction.viewFactory || this.viewFactory;
                        if (viewFactory) {
                            behaviorInstance.view = viewFactory.create(container, behaviorInstance.executionContext, instruction);
                        }
                        if (element) {
                            element.primaryBehavior = behaviorInstance;
                            if (this.usesShadowDOM) {
                                host = element.createShadowRoot();
                            }
                            else {
                                host = element;
                            }
                            if (behaviorInstance.view) {
                                if (!this.usesShadowDOM) {
                                    if (instruction.contentFactory) {
                                        var contentView = instruction.contentFactory.create(container, null, contentSelectorFactoryOptions);
                                        content_selector_1.ContentSelector.applySelectors(contentView, behaviorInstance.view.contentSelectors, function (contentSelector, group) { return contentSelector.add(group); });
                                        behaviorInstance.contentView = contentView;
                                    }
                                }
                                if (this.childExpression) {
                                    behaviorInstance.view.addBinding(this.childExpression.createBinding(host, behaviorInstance.executionContext));
                                }
                                behaviorInstance.view.appendNodesTo(host);
                            }
                            else if (this.childExpression) {
                                bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
                            }
                        }
                        else if (behaviorInstance.view) {
                            //dynamic element with view
                            behaviorInstance.view.owner = behaviorInstance;
                            if (this.childExpression) {
                                behaviorInstance.view.addBinding(this.childExpression.createBinding(instruction.host, behaviorInstance.executionContext));
                            }
                        }
                        else if (this.childExpression) {
                            //dynamic element without view
                            bindings.push(this.childExpression.createBinding(instruction.host, behaviorInstance.executionContext));
                        }
                    }
                    else if (this.childExpression) {
                        //custom attribute
                        bindings.push(this.childExpression.createBinding(element, behaviorInstance.executionContext));
                    }
                    if (element && !(this.apiName in element)) {
                        element[this.apiName] = behaviorInstance.executionContext;
                    }
                    return behaviorInstance;
                };
                HtmlBehaviorResource.prototype.ensurePropertiesDefined = function (instance, lookup) {
                    var properties, i, ii, observer;
                    if ('__propertiesDefined__' in lookup) {
                        return;
                    }
                    lookup.__propertiesDefined__ = true;
                    properties = this.properties;
                    for (i = 0, ii = properties.length; i < ii; ++i) {
                        observer = properties[i].createObserver(instance);
                        if (observer !== undefined) {
                            lookup[observer.propertyName] = observer;
                        }
                    }
                };
                return HtmlBehaviorResource;
            })();
            exports_1("HtmlBehaviorResource", HtmlBehaviorResource);
        }
    }
});
