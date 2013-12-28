'use strict';

var port    = process.env.PORT || 8000;
var express = require('express');
var server  = express();
var cors    = require('cors');

server.get('/', cors(), function(req, res) {
    res.send('test');
});

server.get('/error', cors(), function(req, res) {
    res.status(404);
    res.send();
});

server.listen(port);
console.log('listening on port ' + port);
