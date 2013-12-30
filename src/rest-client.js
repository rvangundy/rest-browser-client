'use strict';

var Client = require('./Client');
var jsonParser = require('./middleware-json');

/**
 * A library interface function for creating a new REST interface
 * @param {String} url The location where the REST API resides
 * @param {String} username A username for an authenticated REST API
 * @param {String} password A password for an authenticated REST API
 */
function rest(url, username, password) {
    return new Client(url, username, password);
}

/***************
 *  Middlware  *
 ***************/

rest.json = jsonParser;

/*************
 *  Exports  *
 *************/

module.exports = rest;
