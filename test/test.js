'use strict';

var rest   = require('../src/rest-client');
var assert = chai.assert;

require('./shim-function.bind');

describe('Client', function () {

    describe('get', function() {
        it('Performs a basic GET operation', function (ok) {
            var client = rest('http://localhost:8000');
            client.get(function(req) {
                assert.equal(req.response, 'test');
                ok();
            });
        });

        it('Calls error middleware', function(ok) {
            var client = rest('http://localhost:8000');

            client.get('/error', function() {
                assert.ok(false, 'Skips normal calls');
            },function(err) {
                assert.ok(err instanceof Error);
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

    describe('post', function() {
        it('Performs a basic POST operation and gets the same response', function(ok) {
            var client  = rest('http://localhost:8000/post');
            var message = { message : 'this is a test' };

            client.use(function(req) {
                req.set('Content-Type', 'application/json');
                if (typeof req.data !== 'string') { req.data = JSON.stringify(req.data); }
            });

            client.post(message, function(req) {
                assert.deepEqual(JSON.parse(req.response), message);
                ok();
            });
        });
    });
});
