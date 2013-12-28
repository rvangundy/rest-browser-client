'use strict';

var rest   = require('../src/rest-client');
var assert = chai.assert;

require('./shim-function.bind');

describe('Client', function () {

    describe('get', function() {
        it('Performs a basic get operation', function (ok) {
            var client = rest('http://localhost:8000');
            client.get(function(req) {
                assert.equal(req.response, 'test');
                ok();
            });
        });

        it('Calls error middleware', function(ok) {
            var message = 'some error';
            var client = rest('http://localhost:8000');

            client.get('/error', function(err) {
                assert.equal(err.status, 404);
                ok();
            });
        });
    });

    describe('use', function() {
        it('Calls middleware when sending a request', function(ok) {
            var client = rest('http://localhost:8000');
            client.use(function() {
                assert.ok(true);
                ok();
            });

            client.get(function(){});
        });
    });
});
