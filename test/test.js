'use strict';

var rest   = require('../src/rest-client');
var assert = chai.assert;

require('./shim-function.bind');

describe('Client', function () {

    describe('get', function() {
        it('Performs a basic get operation', function (ok) {
            var client = rest('http://localhost:8000');
            client.get(function(req) {
                ok();
        });
        it('Calls error middleware', function(ok) {
            var message = 'some error';

                assert.equal(err.status, 404);
                ok();
            });
        });
    });

        });
    });
});
