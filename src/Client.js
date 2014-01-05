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

// isArray polyfill
Array.isArray = Array.isArray || (Array.isArray = function(a){
    return '' + a !== a && {}.toString.call(a) === '[object Array]';
});

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

/**
 * Converts an object in to a string of query parameters
 * @param {Object} obj An object consisting of query parameters
 */
function toQueryParameters(obj) {
    var params = [];

    if (!obj) { return ''; }

    if (obj === Object(obj) && !Array.isArray(obj)) {
        for (var j in obj) {
            params.push(j + '=' + obj[j]);
        }

        return '?' + params.join('&');
    } else {
        return '';
    }
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
 * @param {Response} response A response object prior to being received
 */
function handleMiddleware(path, request, response) {
    var series;
    var all    = this.middleware['*'];
    var pathMw = path ? this.middleware[path] || [] : [];
    var mw     = all.concat(pathMw);

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
    var args = slice.call(arguments, 0);
    var middleware = this.middleware;
    var all = middleware['*'];

    // Establish path-specific middleware
    if (typeof args[0] === 'string') {
        arg = args.shift();
        middleware = middleware[arg] = middleware[arg] || [];
    } else {
        middleware = all;
    }

    // Collect middleware
    for (var i = 0, len = args.length; i < len; i += 1) {
        arg = args[i];

        // Do not use same middleware twice
        if (middleware.indexOf(arg) >= 0 || all.indexOf(arg) >= 0) { return; }

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
        var arg, series, path, data;
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
                path = arg;
                url += arg;
            }

            // Build up callbacks
            else if (isFunction(arg)) { callbacks.push(arg); }

            // Build data
            else {
                data = request.body = arg;
            }
        }

        // Remove unwanted fragments from URL
        url = url.replace(/\/\//, '/');

        // Convert object to query parameters if using the GET method
        if (method === 'GET') {
            url += toQueryParameters(data);
            request.body = null;
        }

        // Open the request, using authentication if available
        if (username && password) {
            request.open(method, url, true, username, password);
        } else {
            request.open(method, url);
        }

        // Pass through available middleware
        handleMiddleware.call(this, path, request, response);

        // Introduce errHandler and middleware from response
        callbacks = response.middleware.concat(callbacks);
        callbacks.splice(0, 0, errorHandler);

        // Beginning listening for callbacks
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                series = createSeries(callbacks);
                response.body = request.response;
                series(request, response);
            }
        };

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

    this.middleware = {
        '*' : []
    };
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
