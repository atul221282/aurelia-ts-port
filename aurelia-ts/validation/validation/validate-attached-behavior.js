define(["require", "exports", '../../templating/index', '../../binding/index', '../validation/validate-attached-behavior-config'], function (require, exports, _index, _index_1, _validate_attached_behavior_config) {
    var ValidateAttachedBehavior = (function () {
        function ValidateAttachedBehavior(element, observerLocator, config) {
            this.element = element;
            this.observerLocator = observerLocator;
            this.changedObservers = [];
            this.config = config;
            this.processedValidation = null;
        }
        ValidateAttachedBehavior.metadata = function () {
            return _index.Behavior.attachedBehavior('validate');
        };
        ValidateAttachedBehavior.inject = function () {
            return [
                Element,
                _index_1.ObserverLocator,
                _validate_attached_behavior_config.ValidateAttachedBehaviorConfig
            ];
        };
        ValidateAttachedBehavior.prototype.valueChanged = function (newValue) {
            if (this.value === null || this.value === undefined)
                return;
            this.processedValidation = this.value;
            if (typeof (this.value) === 'string') {
                return; //this is just to tell the real validation instance (higher in the DOM) the exact property-path to bind to
            }
            else if (this.value.constructor.name === 'ValidationResultProperty') {
                //Binding to a single validation property
                this.subscribeChangedHandlersForProperty(this.value, this.element);
            }
            else {
                //binding to a validation instance
                this.subscribeChangedHandlers(this.element);
            }
        };
        ValidateAttachedBehavior.prototype.searchFormGroup = function (currentElement, currentDepth) {
            if (currentDepth === 5 || currentElement == null) {
                return null;
            }
            if (currentElement.classList && currentElement.classList.contains('form-group')) {
                return currentElement;
            }
            return this.searchFormGroup(currentElement.parentNode, 1 + currentDepth);
        };
        ValidateAttachedBehavior.prototype.findLabels = function (formGroup, inputId) {
            var labels = [];
            this.findLabelsRecursively(formGroup, inputId, labels, 0);
            return labels;
        };
        ValidateAttachedBehavior.prototype.findLabelsRecursively = function (currentElement, inputId, currentLabels, currentDepth) {
            if (currentDepth === 5) {
                return;
            }
            if (currentElement.nodeName === "LABEL" && ((currentElement.attributes['for'] && currentElement.attributes['for'].value === inputId) || (!currentElement.attributes['for']))) {
                currentLabels.push(currentElement);
            }
            for (var i = 0; i < currentElement.children.length; i++)
                this.findLabelsRecursively(currentElement.children[i], inputId, currentLabels, 1 + currentDepth);
        };
        ValidateAttachedBehavior.prototype.subscribeChangedHandlersForAttribute = function (currentElement, attributeName) {
            var atts = currentElement.attributes;
            if (atts[attributeName]) {
                var bindingPath = atts[attributeName].value.trim();
                if (bindingPath.indexOf('|') != -1)
                    bindingPath = bindingPath.split('|')[0].trim();
                var validationProperty = this.value.result.properties[bindingPath];
                if (attributeName == 'validate' && (validationProperty === null || validationProperty === undefined)) {
                    //Dev explicitly stated to show validation on a field, but there's no rules for this field
                    //Hence, we add an empty validationProperty for that field, without any rules
                    //This way, when 'checkAll()' is called, the input element 'turns green'
                    this.value.ensure(bindingPath);
                    validationProperty = this.value.result.properties[bindingPath];
                }
                this.subscribeChangedHandlersForProperty(validationProperty, currentElement);
                return true;
            }
            return false;
        };
        ValidateAttachedBehavior.prototype.subscribeChangedHandlers = function (currentElement) {
            for (var _i = 0; _i < this.config.bindingPathAttributes.length; _i++) {
                if (this.subscribeChangedHandlersForAttribute(currentElement, this.config.bindingPathAttributes[_i])) {
                    break;
                }
            }
            var children = currentElement.children;
            for (var i = 0; i < children.length; i++) {
                this.subscribeChangedHandlers(children[i]);
            }
        };
        ValidateAttachedBehavior.prototype.appendMessageToElement = function (element, validationProperty) {
            var helpBlock = element.nextSibling;
            if (helpBlock) {
                if (!helpBlock.classList) {
                    helpBlock = null;
                }
                else if (!helpBlock.classList.contains('aurelia-validation-message')) {
                    helpBlock = null;
                }
            }
            if (!helpBlock) {
                helpBlock = document.createElement("p");
                helpBlock.classList.add('help-block');
                helpBlock.classList.add('aurelia-validation-message');
                if (element.nextSibling) {
                    element.parentNode.insertBefore(helpBlock, element.nextSibling);
                }
                else {
                    element.parentNode.appendChild(helpBlock);
                }
            }
            if (validationProperty)
                helpBlock.textContent = validationProperty.message;
            else
                helpBlock.textContent = '';
        };
        ValidateAttachedBehavior.prototype.appendUIVisuals = function (validationProperty, currentElement) {
            var formGroup = this.searchFormGroup(currentElement, 0);
            if (formGroup) {
                if (validationProperty) {
                    if (!formGroup.classList) {
                        console.error('ValidateAttachedBehavior found a form-group element without classList. Cannot add the has-warning or has-success classes');
                    }
                    else {
                        if (validationProperty.isValid) {
                            formGroup.classList.remove('has-warning');
                            formGroup.classList.add('has-success');
                        }
                        else {
                            formGroup.classList.remove('has-success');
                            formGroup.classList.add('has-warning');
                        }
                    }
                }
                else {
                    formGroup.classList.remove('has-warning');
                    formGroup.classList.remove('has-success');
                }
                if (this.config.appendMessageToInput) {
                    this.appendMessageToElement(currentElement, validationProperty);
                }
                if (this.config.appendMessageToLabel) {
                    var labels = this.findLabels(formGroup, currentElement.id);
                    for (var ii = 0; ii < labels.length; ii++) {
                        var label = labels[ii];
                        this.appendMessageToElement(label, validationProperty);
                    }
                }
            }
        };
        ValidateAttachedBehavior.prototype.subscribeChangedHandlersForProperty = function (validationProperty, currentElement) {
            var _this = this;
            if (validationProperty !== undefined) {
                this.appendUIVisuals(null, currentElement);
                validationProperty.onValidate(function (validationProperty) {
                    _this.appendUIVisuals(validationProperty, currentElement);
                });
            }
        };
        ValidateAttachedBehavior.prototype.detached = function () {
        };
        ValidateAttachedBehavior.prototype.attached = function () {
            if (this.processedValidation === null || this.processedValidation === undefined)
                this.valueChanged(this.value);
        };
        return ValidateAttachedBehavior;
    })();
    exports.ValidateAttachedBehavior = ValidateAttachedBehavior;
});
