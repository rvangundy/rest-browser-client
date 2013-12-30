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

/**
 * Similar to client.use, except attaches calls to be used only when a response has been returned.
 * This is useful for attaching functionality upfront as middleware by client.use, so that it may
 * be left out of XHR request calls later.
 * @param {Function} middleware A middleware function to use on a response
 */
function use(middleware) {
    this.middleware.push(middleware);
}

/*****************
 *  Constructor  *
 *****************/

function Response(request) {
    this.request = request;
    this.middleware = [];
}

/***************
 *  Prototype  *
 ***************/

Response.prototype = {
    is         : is,
    use        : use,
    body       : null,
    request    : null,
    middleware : null
};

/*************
 *  Exports  *
 *************/

module.exports = Response;
