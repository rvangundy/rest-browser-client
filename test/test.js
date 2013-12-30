'use strict';

var rest   = require('../src/rest-client');
var assert = chai.assert;

require('./shim-function.bind');

describe('Client', function () {

    describe('get', function() {
        it('Performs a basic GET operation', function (ok) {
            var client = rest('http://localhost:8000');
            client.get(function(req, res) {
                assert.equal(res.body, 'test');
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
                if (typeof req.body !== 'string') { req.body = JSON.stringify(req.body); }
            });

            client.post(message, function(req, res) {
                assert.deepEqual(JSON.parse(res.body), message);
                ok();
            });
        });
    });
});

describe('Response', function() {
    describe('.is', function() {
        it('Correctly determines mime-type', function(ok) {
            var client = rest('http://localhost:8000');
            client.get(function(req, res) {
                assert.ok(res.is('text/*'));
                assert.ok(res.is('html'));
                assert.ok(res.is('text/html'));
                assert.notOk(res.is('json'));
                ok();
            });
        });
    });
});

describe('middleware', function() {
    describe('json', function() {
        it('Stringifies outgoing JSON', function(ok) {
            var client = rest('http://localhost:8000/post');
            var person = { first : 'Ben', last : 'Franklin' };

            client.use(rest.json(), function(req){
                assert.equal(req.body, JSON.stringify(person));
                ok();
            });

            client.post(person);
        });

        it('Parses incoming JSON', function(ok) {
            var client = rest('http://localhost:8000/json');
            var person = { first : 'Ben', last : 'Franklin' };

            client.use(rest.json());

            client.get(function(req, res) {
                assert.deepEqual(res.body, person);
                ok();
            });
        });
    });
});
