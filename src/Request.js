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
