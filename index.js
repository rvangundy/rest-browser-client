(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/******************
 *  Dependencies  *
 ******************/

var amendRequest = require('./Request');
var Response     = require('./Response');

/***************
 *  Utilities  *
 ***************/

var slice = Array.prototype.slice;

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

/**
 * Gets the argument names defined on a particular function
 * @param  {Function} func The function to query
 * @return {Array}         An array of argument names
 */
function getArgNames (func) {
    var fnStr  = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    if (result === null) { result = []; }
    return result;
}

/**
 * Determines if the passed argument is a function
 * @param  {Variant}  functionToCheck
 * @return {Boolean}                 Whether the passed argument is a function
 */
function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

/***********************
 *  Callback Handling  *
 ***********************/

/**
 * Determines if the passed function is an error handler. An error handler
 * is any function whose first argument is labeled 'err'.
 * @param {Function} func A function to check for error handling
 */
function isErrorHandler(func) {
    var args = getArgNames(func);

    return args.indexOf('err') === 0;
}

/**
 * Calls a collection of callbacks in series. The callbacks array is
 * modified, so if it's necessary to retain the original collection,
 * a copy should be made before passing it to series.
 * @param  {Array} callbacks A collection of functions to call in series
 */
function createSeries(callbacks) {
    return function(/* arguments */) {
        var args = slice.call(arguments, 0);
        var errArgs;

        function next(error) {
            var callback = callbacks.shift();

            if (!callback) { return; }

            // Create an error object
            if (typeof error === 'string') {
                error = new Error(error);
            }

            // If no errors, try calling the next callback
            if (!error) {
                try {
                    if (isErrorHandler(callback)) {
                        errArgs = [null].concat(args);
                        callback.apply(null, errArgs);
                    } else {
                        callback.apply(null, args);
                    }
                } catch (e) {
                    next(e);
                }

            // If in an error state, call only error handlers
            } else if (isErrorHandler(callback)) {
                errArgs = [error].concat(args);
                callback.apply(null, errArgs);

            // If in an error state, do not call non-error handling callbacks
            } else {
                next(error);
            }
        }

        args.push(next);
        next();
    };
}

/**
 * Passes the request through available middleware
 * @param {XMLHttpRequest} request An xhr object prior to being sent
 */
function handleMiddleware(request, response) {
    var series;
    var mw = this.middleware = this.middleware || [];

    series = createSeries(mw);

    series(request, response);
}

/**
 * Checks the status of the request and generates an error if not 200.
 * @param {XMLHttpRequest} req An xhr object
 */
function errorHandler(req, res, next) {
    if (req.readyState === 4 && (req.status >= 400 || !req.status)) {
        next(req.statusText);
    } else {
        next();
    }
}

/********************
 *  Public Methods  *
 ********************/

/**
 * Assigns new middleware to the outgoing request for a given client
 * @param {Function} middleware One or more functions to use as middlware
 */
function use(/* arguments */) {
    var arg;
    var middleware = this.middleware = this.middleware || [];

    for (var i = 0, len = arguments.length; i < len; i += 1) {
        arg = arguments[i];

        // Do not use same middleware twice
        if (middleware.indexOf(arg) >= 0) { return; }

        middleware.push(arg);
    }
}

/**
 * Creates the specified XHR method. This may be used to generate XHR VERBs in to the
 * client.
 * @param {String} method The XHR method to use, e.g. GET, POST, etc.
 */
function createXHRMethod(method) {
    method = method.toUpperCase();

    return function sendXHR(/* arguments */) {
        var arg, series;
        var callbacks = [];
        var url       = this.url;
        var request   = amendRequest(new XMLHttpRequest(), url);
        var username  = this.username;
        var password  = this.password;
        var response  = new Response(request);

        // Sort arguments in to paths, data, and callbacks
        for (var i = 0, len = arguments.length; i < len; i += 1) {
            arg = arguments[i];

            // Create the URL
            if (typeof arg === 'string' && arg.indexOf('/') === 0) {
                url += arg;
            }

            // Build up callbacks
            else if (isFunction(arg)) { callbacks.push(arg); }

            // Build data
            else {
                request.body = arg;
            }
        }

        // Add an error handler and create a series call
        callbacks.splice(0, 0, errorHandler);
        series = createSeries(callbacks);

        // Open the request, using authentication if available
        if (username && password) {
            request.open(method, url, true, username, password);
        } else {
            request.open(method, url);
        }

        // Pass through available middleware
        handleMiddleware.call(this, request, response);

        // Beginning listening for callbacks
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                response.body = request.response;
                series(request, response);
            }
        }.bind(this);

        request.send(request.body);
    };
}

/*****************
 *  Constructor  *
 *****************/

function Client(url, username, password) {
    this.url      = url || '';
    this.username = username;
    this.password = password;
}

/***************
 *  Prototype  *
 ***************/

Client.prototype = {
    use           : use,
    get           : createXHRMethod('GET'),
    post          : createXHRMethod('POST'),
    middleware    : null,
    url           : null,
    username      : null,
    password      : null
};

/*************
 *  Exports  *
 *************/

module.exports = Client;

},{"./Request":2,"./Response":3}],2:[function(require,module,exports){
'use strict';

/***************
 *  Utilities  *
 ***************/

/**
 * Extends the target object with properties from the other object
 * @param {Object} target The object to extend, and the one returned
 * @param {Object} object The object to borrow properties from
 */
function extend(target, obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            target[i] = obj[i];
        }
    }

    return target;
}

/*********
 *  API  *
 *********/

/**
 * Returns the specified header property
 * @param {String} key The key associated with a header value
 * @return {String} The header value
 */
function get(key) {
    return this.getResponseHeader(key);
}

/**
 * Returns the specified header property
 * @param {String} key   The key associated with a header
 * @param {String} value The header value
 */
function set(key, value) {
    this.setRequestHeader(key, value);
}

/*****************
 *  Constructor  *
 *****************/

/**
 * Creates a new request object, appending new convenience methods as appropriate
 * @param {XMLHttpRequest} request an XHR object
 */
function Request(request, url) {
    if (request) {
        extend(request, Request.prototype);
    }

    request.path = url;

    return request;
}

/***************
 *  Prototype  *
 ***************/

Request.prototype = {
    get  : get,
    set  : set,
    path : null,
    body : null
};

/*************
 *  Exports  *
 *************/

module.exports = Request;

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Determines if the specified mime-type is included in the Content-Type header.
 * @param {String} type A content type to match
 * @return {Boolean} True if a matching mime-type is found
 */
function is(type) {
    var items;
    var contentType = this.request.getResponseHeader('Content-Type');

    if (!contentType) { return false; }

    items = contentType.split(';');

    for (var i = 0, len = items.length; i < len; i += 1) {
        contentType = items[i];

        if (contentType.indexOf('/') < 0) { continue; }

        // Check explicit match if a '/' is included without a wildcard
        if (type.indexOf('/') > -1 && type.indexOf('/*') < 0) {
            return contentType.toLowerCase() === type.toLowerCase();
        }

        // Check wildcard matching
        if (type.indexOf('/*') > -1) {
            return contentType.split('/')[0].toLowerCase() === type.split('/')[0].toLowerCase();
        }

        // Check subtype matching
        return contentType.split('/')[1].toLowerCase() === type.toLowerCase();
    }

    return false;
}

/*****************
 *  Constructor  *
 *****************/

function Response(request) {
    this.request = request;
}

/***************
 *  Prototype  *
 ***************/

Response.prototype = {
    is      : is,
    body    : null,
    request : null
};

/*************
 *  Exports  *
 *************/

module.exports = Response;

},{}],4:[function(require,module,exports){
'use strict';

var Client = require('./Client');

module.exports = function(path, username, password) {
    return new Client(path, username, password);
};

},{"./Client":1}]},{},[4])