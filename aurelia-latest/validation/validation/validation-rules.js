import {Utilities} from '../validation/utilities';
import {ValidationLocale} from '../validation/validation-locale';

export class ValidationRule {
  constructor(threshold, onValidate, message) {
    this.onValidate = onValidate;
    this.threshold = threshold;
    this.message = message;
    this.errorMessage = null;
    this.ruleName = this.constructor.name;
  }

  withMessage(message) {
    this.message = message;
  }

  explain() {
    return this.errorMessage;
  }

  setResult(result, currentValue, locale) {
    if (result === true || result === undefined || result === null || result === '' ) {
      this.errorMessage = null;
      return true;
    }
    else {
      if (typeof(result) === 'string') {
        this.errorMessage = result;
      }
      else {
        if (this.message) {
          if (typeof(this.message) === 'function') {
            this.errorMessage = this.message(currentValue, this.threshold);
          }
          else if (typeof(this.message) === 'string') {
            this.errorMessage = this.message;
          }
          else
            throw 'Unable to handle the error message:' + this.message;
        }
        else {
          this.errorMessage = locale.translate(this.ruleName, currentValue, this.threshold);
        }
      }
      return false;
    }
  }

  /**
   * Validation rules: return a promise that fulfills and resolves to true/false
   */
  validate(currentValue, locale) {
    if(locale === undefined)
    {
      locale = ValidationLocale.Repository.default;
    }

    currentValue = Utilities.getValue(currentValue);
    var result = this.onValidate(currentValue, this.threshold, locale);
    var promise = Promise.resolve(result);

    var nextPromise = promise.then(
      (promiseResult) => {
        return this.setResult(promiseResult, currentValue, locale);
      },
      (promiseFailure) => {
        if( typeof(promiseFailure) === 'string' && promiseFailure !== '')
          return this.setResult(promiseFailure, currentValue, locale);
        else
          return this.setResult(false, currentValue, locale);
      }
    );
    return nextPromise;
  }
}

export class EmailValidationRule extends ValidationRule {
  //https://github.com/chriso/validator.js/blob/master/LICENSE
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        if (/\s/.test(newValue)) {
          return false;
        }
        var parts = newValue.split('@');
        var domain = parts.pop();
        var user = parts.join('@');

        if (!this.isFQDN(domain)) {
          return false;
        }
        return this.emailUserUtf8Regex.test(user);
      }
    );  
    this.emailUserUtf8Regex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))$/i;
    this.isFQDN = function (str) {
      var parts = str.split('.');
      for (var part, i = 0; i < parts.length; i++) {
        part = parts[i];
        if (part.indexOf('__') >= 0) {
          return false;
        }
        part = part.replace(/_/g, '');
        if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
          return false;
        }
        if (part[0] === '-' || part[part.length - 1] === '-' ||
          part.indexOf('---') >= 0) {
          return false;
        }
      }
      return true;
    };
  }
}

export class MinimumLengthValidationRule extends ValidationRule {
  constructor(minimumLength) {
    super(
      minimumLength,
      (newValue, minimumLength) => {
        return newValue.length !== undefined && newValue.length >= minimumLength;
      }
    );
  }
}

export class MaximumLengthValidationRule extends ValidationRule {
  constructor(maximumLength) {
    super(
      maximumLength,
      (newValue, maximumLength) => {
        return newValue.length !== undefined && newValue.length <= maximumLength;
      }
    );
  }
}

export class BetweenLengthValidationRule extends ValidationRule {
  constructor(minimumLength, maximumLength) {
    super(
      {minimumLength: minimumLength, maximumLength: maximumLength},
      (newValue, threshold) => {
        return newValue.length !== undefined
          && newValue.length >= threshold.minimumLength
          && newValue.length <= threshold.maximumLength;
      }
    );
  }
}

export class CustomFunctionValidationRule extends ValidationRule {
  constructor(customFunction, threshold) {
    super(
      threshold,
      customFunction
    )
  }
}

export class NumericValidationRule extends ValidationRule {
  constructor() {
    super(
      null,
      (newValue, threshold, locale) => {
        var numericRegex = locale.setting('numericRegex');
        var floatValue = parseFloat(newValue);
        return !Number.isNaN(parseFloat(floatValue))
          && Number.isFinite(floatValue)
          && numericRegex.test(newValue);
      }
    );
  }
}

export class RegexValidationRule extends ValidationRule {
  constructor(regex) {
    super(
      regex,
      (newValue, regex) => {
        return regex.test(newValue);
      }
    );
  }
}

export class ContainsOnlyValidationRule extends RegexValidationRule{
  constructor(regex){
    super(regex);
  }
}

export class MinimumValueValidationRule extends ValidationRule {
  constructor(minimumValue) {
    super(
      minimumValue,
      (newValue, minimumValue) => {
        return Utilities.getValue(minimumValue) < newValue;
      }
    );
  }
}

export class MinimumInclusiveValueValidationRule extends ValidationRule {
  constructor(minimumValue) {
    super(
      minimumValue,
      (newValue, minimumValue) => {
        return Utilities.getValue(minimumValue) <= newValue;
      }
    );
  }
}

export class MaximumValueValidationRule extends ValidationRule {
  constructor(maximumValue) {
    super(
      maximumValue,
      (newValue, maximumValue) => {
        return newValue < Utilities.getValue(maximumValue);
      }
    );
  }
}

export class MaximumInclusiveValueValidationRule extends ValidationRule{
  constructor(maximumValue) {
    super(
      maximumValue,
      (newValue, maximumValue) => {
        return newValue <= Utilities.getValue(maximumValue);
      }
    );
  }
}

export class BetweenValueValidationRule extends ValidationRule {
  constructor(minimumValue, maximumValue) {
    super(
      {minimumValue: minimumValue, maximumValue: maximumValue},
      (newValue, threshold) => {
        return Utilities.getValue(threshold.minimumValue) <= newValue && newValue <= Utilities.getValue(threshold.maximumValue);
      }
    );
  }
}

export class DigitValidationRule extends ValidationRule {
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        return this.digitRegex.test(newValue);
      }
    );
    this.digitRegex = /^\d+$/;
  }
}

export class AlphaNumericValidationRule extends ValidationRule {
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        return this.alphaNumericRegex.test(newValue);
      }
    );
    this.alphaNumericRegex = /^[a-z0-9]+$/i;
  }
}

export class AlphaValidationRule extends ValidationRule {
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        return this.alphaRegex.test(newValue);
      }
    );
    this.alphaRegex = /^[a-z]+$/i;
  }
}


export class AlphaOrWhitespaceValidationRule extends ValidationRule{
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        return this.alphaNumericRegex.test(newValue);
      }
    );
    this.alphaNumericRegex = /^[a-z\s]+$/i;
  }
}


export class AlphaNumericOrWhitespaceValidationRule extends ValidationRule {
  constructor() {
    super(
      null,
      (newValue, threshold) => {
        return this.alphaNumericRegex.test(newValue);
      }
    );
    this.alphaNumericRegex = /^[a-z0-9\s]+$/i;
  }
}

export class MediumPasswordValidationRule extends ValidationRule {
  constructor(minimumComplexityLevel) {
    super(
      (minimumComplexityLevel) ? minimumComplexityLevel : 3,
      (newValue, threshold) => {
        if (typeof (newValue) !== 'string')
          return false;
        var strength = 0;

        strength += /[A-Z]+/.test(newValue) ? 1 : 0;
        strength += /[a-z]+/.test(newValue) ? 1 : 0;
        strength += /[0-9]+/.test(newValue) ? 1 : 0;
        strength += /[\W]+/.test(newValue) ? 1 : 0;
        return strength >= threshold;
      }
    );
  }
}


export class StrongPasswordValidationRule extends MediumPasswordValidationRule
{
  constructor(){
    super(4);
  }
}

export class EqualityValidationRuleBase extends ValidationRule {
  constructor(otherValue, equality, otherValueLabel) {
    super(
      {
        otherValue: otherValue,
        equality: equality,
        otherValueLabel: otherValueLabel
      },
      (newValue, threshold) => {
        var otherValue = Utilities.getValue(threshold.otherValue);
        if (newValue instanceof Date && otherValue instanceof Date)
          return threshold.equality === (newValue.getTime() === otherValue.getTime());
        return threshold.equality === (newValue === otherValue);
      }
    );
  }
}

export class EqualityValidationRule extends EqualityValidationRuleBase{
  constructor(otherValue){
    super(otherValue, true);
  }
}

export class EqualityWithOtherLabelValidationRule extends EqualityValidationRuleBase{
  constructor(otherValue, otherLabel){
    super(otherValue, true, otherLabel);
  }
}

export class InEqualityValidationRule extends EqualityValidationRuleBase{
  constructor(otherValue){
    super(otherValue, false);
  }
}

export class InEqualityWithOtherLabelValidationRule extends EqualityValidationRuleBase{
  constructor(otherValue, otherLabel){
    super(otherValue, false, otherLabel);
  }
}


export class InCollectionValidationRule extends ValidationRule {
  constructor(collection) {
    super(
      collection,
      (newValue, threshold) => {
        var collection = Utilities.getValue(threshold);
        for (let i = 0; i < collection.length; i++) {
          if (newValue === collection[i])
            return true;
        }
        return false;
      }
    );
  }
}
