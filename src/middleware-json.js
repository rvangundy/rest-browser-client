'use strict';

module.exports = function() {

    return function json(req, res, next) {
        var reqBody = req.body;

        // Convert outgoing javascript object to JSON and prepare header
        if (req.readyState === 1) {
            if (reqBody && typeof reqBody !== 'string') { req.body = JSON.stringify(reqBody); }
            req.set('Content-Type', 'application/json');
        }

        // Add JSON parsing to response
        res.use(function(req, res, next) {
            var resBody = res.body;
            if (resBody && res.is('json') && typeof resBody === 'string') { res.body = JSON.parse(resBody); }
            next();
        });

        next();
    };
};
