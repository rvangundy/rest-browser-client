'use strict';

var Client = require('./Client');

module.exports = function(path, username, password) {
    return new Client(path, username, password);
};
