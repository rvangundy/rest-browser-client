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
