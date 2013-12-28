'use strict';

var rest   = require('../src/rest-client');
var assert = chai.assert;

require('./shim-function.bind');

describe('Client', function () {
    var client = rest('http://localhost:8000');

    it('performs a basic get operation', function (ok) {
        client.get('', function(req) {
            assert.equal(req.response, 'test');
            ok();
        });
    });
});
