import core from 'core-js';
import {map} from './dsl';

var specials = [
  '/', '.', '*', '+', '?', '|',
  '(', ')', '[', ']', '{', '}', '\\'
];

var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

// A Segment represents a segment in the original route description.
// Each Segment type provides an `eachChar` and `regex` method.
//
// The `eachChar` method invokes the callback with one or more character
// specifications. A character specification consumes one or more input
// characters.
//
// The `regex` method returns a regex fragment for the segment. If the
// segment is a dynamic or star segment, the regex fragment also includes
// a capture.
//
// A character specification contains:
//
// * `validChars`: a String with a list of all valid characters, or
// * `invalidChars`: a String with a list of all invalid characters
// * `repeat`: true if the character specification can repeat

class StaticSegment {
  constructor(string) {
    this.string = string;
  }

  eachChar(callback) {
    for (let ch of this.string) {
      callback({ validChars: ch });
    }
  }

  regex() {
    return this.string.replace(escapeRegex, '\\$1');
  }

  generate() {
    return this.string;
  }
}

class DynamicSegment {
  constructor(name) {
    this.name = name;
  }

  eachChar(callback) {
    callback({ invalidChars: '/', repeat: true });
  }

  regex() {
    return '([^/]+)';
  }

  generate(params, consumed) {
    consumed[this.name] = true;
    return params[this.name];
  }
}

class StarSegment {
  constructor(name) {
    this.name = name;
  }

  eachChar(callback) {
    callback({ invalidChars: '', repeat: true });
  }

  regex() {
    return '(.+)';
  }

  generate(params, consumed) {
    consumed[this.name] = true;
    return params[this.name];
  }
}

class EpsilonSegment {
  eachChar() {}
  regex() { return ''; }
  generate() { return ''; }
}

function parse(route, names, types) {
  // normalize route as not starting with a '/'. Recognition will
  // also normalize.
  if (route.charAt(0) === '/') {
    route = route.substr(1);
  }

  var results = [];

  for (let segment of route.split('/')) {
    let match;

    if (match = segment.match(/^:([^\/]+)$/)) {
      results.push(new DynamicSegment(match[1]));
      names.push(match[1]);
      types.dynamics++;
    } else if (match = segment.match(/^\*([^\/]+)$/)) {
      results.push(new StarSegment(match[1]));
      names.push(match[1]);
      types.stars++;
    } else if(segment === '') {
      results.push(new EpsilonSegment());
    } else {
      results.push(new StaticSegment(segment));
      types.statics++;
    }
  }

  return results;
}

// A State has a character specification and (`charSpec`) and a list of possible
// subsequent states (`nextStates`).
//
// If a State is an accepting state, it will also have several additional
// properties:
//
// * `regex`: A regular expression that is used to extract parameters from paths
//   that reached this accepting state.
// * `handlers`: Information on how to convert the list of captures into calls
//   to registered handlers with the specified parameters.
// * `types`: How many static, dynamic, or star segments in this route. Used to
//   decide which route to use if multiple registered routes match a path.
//
// Currently, State is implemented naively by looping over `nextStates` and
// comparing a character specification against a character. A more efficient
// implementation would use a hash of keys pointing at one or more next states.

class State {
  constructor(charSpec) {
    this.charSpec = charSpec;
    this.nextStates = [];
  }

  get(charSpec) {
    for (let child of this.nextStates) {
      var isEqual = child.charSpec.validChars === charSpec.validChars &&
                    child.charSpec.invalidChars === charSpec.invalidChars;

      if (isEqual) {
        return child;
      }
    }
  }

  put(charSpec) {
    var state = this.get(charSpec);

    // If the character specification already exists in a child of the current
    // state, just return that state.
    if (state) {
      return state;
    }

    // Make a new state for the character spec
    state = new State(charSpec);

    // Insert the new state as a child of the current state
    this.nextStates.push(state);

    // If this character specification repeats, insert the new state as a child
    // of itself. Note that this will not trigger an infinite loop because each
    // transition during recognition consumes a character.
    if (charSpec.repeat) {
      state.nextStates.push(state);
    }

    // Return the new state
    return state;
  }

  // Find a list of child states matching the next character
  match(ch) {
    var nextStates = this.nextStates, results = [],
        child, charSpec, chars;

    for (var i = 0, l = nextStates.length; i < l; i++) {
      child = nextStates[i];

      charSpec = child.charSpec;

      if (typeof (chars = charSpec.validChars) !== 'undefined') {
        if (chars.indexOf(ch) !== -1) {
          results.push(child);
        }
      } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
        if (chars.indexOf(ch) === -1) {
          results.push(child);
        }
      }
    }

    return results;
  }
};

// This is a somewhat naive strategy, but should work in a lot of cases
// A better strategy would properly resolve /posts/:id/new and /posts/edit/:id.
//
// This strategy generally prefers more static and less dynamic matching.
// Specifically, it
//
//  * prefers fewer stars to more, then
//  * prefers using stars for less of the match to more, then
//  * prefers fewer dynamic segments to more, then
//  * prefers more static segments to more
function sortSolutions(states) {
  return states.sort((a, b) => {
    if (a.types.stars !== b.types.stars) {
      return a.types.stars - b.types.stars;
    }

    if (a.types.stars) {
      if (a.types.statics !== b.types.statics) {
        return b.types.statics - a.types.statics;
      }
      if (a.types.dynamics !== b.types.dynamics) {
        return b.types.dynamics - a.types.dynamics;
      }
    }

    if (a.types.dynamics !== b.types.dynamics) {
      return a.types.dynamics - b.types.dynamics;
    }

    if (a.types.statics !== b.types.statics) {
      return b.types.statics - a.types.statics;
    }

    return 0;
  });
}

function recognizeChar(states, ch) {
  var nextStates = [];

  for (var i = 0, l = states.length; i < l; i++) {
    var state = states[i];

    nextStates = nextStates.concat(state.match(ch));
  }

  return nextStates;
}

class RecognizeResults {
  constructor(queryParams) {
    this.splice = Array.prototype.splice;
    this.slice = Array.prototype.slice;
    this.push = Array.prototype.push;
    this.length = 0;
    this.queryParams = queryParams || {};
  }
}

function findHandler(state, path, queryParams) {
  var handlers = state.handlers, regex = state.regex;
  var captures = path.match(regex), currentCapture = 1;
  var result = new RecognizeResults(queryParams);

  for (var i = 0, l = handlers.length; i < l; i++) {
    var handler = handlers[i], names = handler.names, params = {};

    for (var j = 0, m = names.length; j < m; j++) {
      params[names[j]] = captures[currentCapture++];
    }

    result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
  }

  return result;
}

function addSegment(currentState, segment) {
  segment.eachChar(ch => {
    currentState = currentState.put(ch);
  });

  return currentState;
}

// The main interface

export class RouteRecognizer {
  constructor() {
    this.map = map;
    this.rootState = new State();
    this.names = {};
  }

  add(route) {
    if (Array.isArray(route)) {
      for (let r of route) {
        this.add(r);
      }

      return;
    }

    var currentState = this.rootState, regex = '^',
        types = { statics: 0, dynamics: 0, stars: 0 },
        names = [], routeName = route.handler.name,
        isEmpty = true;

    var segments = parse(route.path, names, types);
    for (let segment of segments) {
      if (segment instanceof EpsilonSegment) {
        continue;
      }

      isEmpty = false;

      // Add a '/' for the new segment
      currentState = currentState.put({ validChars: '/' });
      regex += '/';

      // Add a representation of the segment to the NFA and regex
      currentState = addSegment(currentState, segment);
      regex += segment.regex();
    }

    if (isEmpty) {
      currentState = currentState.put({ validChars: '/' });
      regex += '/';
    }

    var handlers = [{ handler: route.handler, names: names }];

    if (routeName) {
      this.names[routeName] = {
        segments: segments,
        handlers: handlers
      };
    }

    currentState.handlers = handlers;
    currentState.regex = new RegExp(regex + '$');
    currentState.types = types;
  }

  handlersFor(name) {
    var route = this.names[name],
        result = [];

    if (!route) {
      throw new Error(`There is no route named ${name}`);
    }

    for (var i=0, l=route.handlers.length; i<l; i++) {
      result.push(route.handlers[i]);
    }

    return result;
  }

  hasRoute(name) {
    return !!this.names[name];
  }

  generate(name, params) {
    params = Object.assign({}, params);

    var route = this.names[name],
        consumed = {}, output = '';

    if (!route) {
      throw new Error(`There is no route named ${name}`);
    }

    var segments = route.segments;

    for (var i = 0, l = segments.length; i < l; i++) {
      var segment = segments[i];

      if (segment instanceof EpsilonSegment) {
        continue;
      }

      output += '/';
      var segmentValue = segment.generate(params, consumed);
      if (segmentValue === null || segmentValue === undefined) {
        throw new Error(`A value is required for route parameter '${segment.name}' in route '${name}'.`);
      }

      output += segmentValue;
    }

    if (output.charAt(0) !== '/') {
      output = '/' + output;
    }

    // remove params used in the path and add the rest to the querystring
    for (var param in consumed) {
      delete params[param];
    }

    output += this.generateQueryString(params);

    return output;
  }

  generateQueryString(params) {
    var pairs = [], keys = [], encode = encodeURIComponent;

    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        keys.push(key);
      }
    }

    keys.sort();
    for (var i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      var value = params[key];
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        var arrayKey = `${encode(key)}[]`;
        for (var j = 0, l = value.length; j < l; j++) {
          pairs.push(`${arrayKey}=${encode(value[j])}`);
        }
      } else {
        pairs.push(`${encode(key)}=${encode(value)}`);
      }
    }

    if (pairs.length === 0) {
      return '';
    }

    return '?' + pairs.join('&');
  }

  parseQueryString(queryString) {
    var queryParams = {};
    if (!queryString || typeof queryString !== 'string') {
      return queryParams;
    }

    if (queryString.charAt(0) === '?') {
      queryString = queryString.substr(1);
    }

    var pairs = queryString.split('&');
    for(var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('='),
          key = decodeURIComponent(pair[0]),
          keyLength = key.length,
          isArray = false,
          value;

      if (!key) {
        continue;
      } else if (pair.length === 1) {
        value = true;
      } else {
        //Handle arrays
        if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
          isArray = true;
          key = key.slice(0, keyLength - 2);
          if(!queryParams[key]) {
            queryParams[key] = [];
          }
        }
        value = pair[1] ? decodeURIComponent(pair[1]) : '';
      }
      if (isArray) {
        queryParams[key].push(value);
      } else {
        queryParams[key] = value;
      }
    }
    return queryParams;
  }

  recognize(path) {
    var states = [ this.rootState ],
        pathLen, i, l, queryStart, queryParams = {},
        isSlashDropped = false;

    queryStart = path.indexOf('?');
    if (queryStart !== -1) {
      var queryString = path.substr(queryStart + 1, path.length);
      path = path.substr(0, queryStart);
      queryParams = this.parseQueryString(queryString);
    }

    path = decodeURI(path);

    if (path.charAt(0) !== '/') {
      path = '/' + path;
    }

    pathLen = path.length;
    if (pathLen > 1 && path.charAt(pathLen - 1) === '/') {
      path = path.substr(0, pathLen - 1);
      isSlashDropped = true;
    }

    for (i = 0, l = path.length; i < l; i++) {
      states = recognizeChar(states, path.charAt(i));
      if (!states.length) {
        break;
      }
    }

    var solutions = [];
    for (i=0, l=states.length; i<l; i++) {
      if (states[i].handlers) {
        solutions.push(states[i]);
      }
    }

    states = sortSolutions(solutions);

    var state = solutions[0];
    if (state && state.handlers) {
      // if a trailing slash was dropped and a star segment is the last segment
      // specified, put the trailing slash back
      if (isSlashDropped && state.regex.source.slice(-5) === '(.+)$') {
        path = path + '/';
      }
      return findHandler(state, path, queryParams);
    }
  }
}
