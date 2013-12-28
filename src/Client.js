'use strict';

/******************
 *  Dependencies  *
 ******************/

var amendRequest = require('./Request');

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

/***********************
 *  Callback Handling  *
 ***********************/

/**
 * Determines if the passed function is an error handler
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
                    callback.apply(null, args);
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
function handleMiddleware(request) {
    var series;
    var mw = this.middleware = this.middleware || [];

    series = createSeries(mw);

    series(request);
}

/**
 * Checks the status of the request and generates an error if not 200.
 * @param {XMLHttpRequest} req An xhr object
 */
function errorHandler(req, next) {
    if (req.readyState === 4 && request.status >= 400) {
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
 * Performs an HTTP GET request
 * @param {String} path The path to the API based on this client's base URL
 */
function get(/* arguments */) {
    var series;
    var callbacks = [];
    var url       = this.url;
    var request   = amendRequest(new XMLHttpRequest(), url);
    var username  = this.username;
    var password  = this.password;

    // Sort arguments in to paths and callbacks
    for (var i = 0, len = arguments.length; i < len; i += 1) {
        if (typeof arguments[i] === 'string') { url += arguments[i]; }
        else { callbacks.push(arguments[i]); }
    }

    // Add an error handler and create a series call
    callbacks.splice(0, errorHandler);
    series = createSeries(callbacks);

    // Open the request, using authentication if available
    if (username && password) {
        request.open('GET', url, true, username, password);
    } else {
        request.open('GET', url);
    }

    // Pass through available middleware
    handleMiddleware.call(this, request);

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            series(request);
        }
    }.bind(this);

    request.send(null);
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
    get           : get,
    middleware    : null,
    url           : null,
    username      : null,
    password      : null
};

/*************
 *  Exports  *
 *************/

module.exports = Client;
