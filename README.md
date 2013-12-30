rest-browser-client
=======

A library for building RESTful clients in the browser. Inspired by the connect and express.js framework, this library is intended to allow symmetry between server-side JavaScript and front-end code.

## Background

Server-side JavaScript running in Node.js is dominated by use of the Connect and Express.js frameworks. These provide an elegant API for HTTP communications on the server-side. The use of middleware allows for reusability of small functional components and a highly customizable server-side interface.

Client-side techniques for making HTTP requests in the browser are diverse and inconsistent. The rest-browser-client library closely mimics the syntax and style of the express.js library and introduces the concept of 'middleware' to the client.

Installation
=======
```
npm install rvangundy/rest-browser-client --save
```

Usage
=====

The rest-browser-client is intended for use on the client-side using [browserify](https://github.com/substack/node-browserify). The package returns a function used to create a new REST client.

```javascript
var rest = require('rest-browser-client');

var client = rest(baseUrl, username, password);
```

The arguments work as follows:

### baseUrl

The URL of a RESTful interface. For example, ```http://www.your-site.com/api```.

### username

A username for an authenticated interface.

### password

A password for an authenticated interface.

## Methods

### client.use(middleware)

Attaches new 'middleware' to outgoing requests. Note that this does not work exactly like .use() in express. Middleware is called after an XHR connection has been opened, but before the actual request is sent. Middleware is often used for establishing headers on the request object. Additionally, event registration is also a good candidate for middleware, such as registering for progress updates. Note that a single .use() method may be used to register several middleware handlers.

The following example demonstrates some middleware for sending JSON to the server.  Middleware functions accept a request and response object as a parameter:

```javascript
client.use(function(req, res, next), {
    req.set('Content-Type', 'application/json');
    if (typeof req.body !== 'string') { req.body = JSON.stringify(req.body); }
    next();
});
```

It is also possible to register error handling middleware. In case of an error in an outgoing request, all middleware is skipped other than those for handling errors. To generate an error, pass a string or an error object in to the next() callback. Note that error-handling middleware *must* include ```err``` as its first parameter.

```javascript
client.use(function(err, req, res, next) {
    if (err) { console.log(err.message); }
    else { next(); }
});
```

To generate an error:

```javascript
function errHandler(err, req, res) {
    if (err) { console.log(err.message); }
});

client.use(function(req, res, next) {
    // Do something erroneous
    next('An error has occurred');
}, errHandler);
```

### client.get([path], callback)

Sends an HTTP GET command to the server. When the response has been received, any callbacks passed will be called. Callbacks are similar to middleware, including the same arguments and error handling capabilities. If a path is included, it must be prefaced with a ```/``` and will be appended to the API URL specified when instantiating the client.

The following example retrieves some JSON data from the server and parses it:

```javascript
client.get('/user', function(req, res, next) {
    if (res.is('json')) { console.log(JSON.parse(res.body)); }
    else { next('Server did not return JSON data'); }
}, errHandler);
```

### client.post([path], data, callback)

Sends an HTTP POST command to the server. Arguments work the same as those for ```client.get```, except for an additional ```data``` argument.

The following example posts some JSON to the server:

```javascript
// Request middleware for converting javascript objects to JSON strings
client.use(function(req, res, next) {
    if (req.body && typeof req.body !== 'string') { req.body = JSON.stringify(req.body); }
    next();
});

client.post('/user_submit', { first : 'Ben', last : 'Franklin' }, function(err, req, res, next) {
    if (err) { console.log('An error occurred'); }
});
```

# Request

The request object passed in to the middleware and callbacks is a modified XMLHttpRequest object. The following properties and methods have been added:

## Properties

### request.path

The full path to the requested resource. If a remote URL was specified on client instantiation, this includes the domain.

### request.body

The data that is sent to the server on a POST command. The body may be modified by various middleware.

## Methods

### request.get(key)

A shortcut for request.getResponseHeader

### request.set(key, value)

A shortcut for request.setRequestHeader

# Response

The response object contains properties and methods convenient for handling data returned from a server.

## Properties

### response.body

The returned data. By default, response.body is the same value as request.response.  Callbacks may be used to parse the response body appropriately.

## Methods

## response.is(type)

Determines if the response data matches the specified type.

```javascript
// Response is text/html
res.is('text/*') // true
res.is('html') // true
res.is('text/html') // true
res.is('json') // false

```

## response.use(middleware)

In Express.js, middleware is used between a request and a response on the server-side. In a client, XMLHttpRequests are sent then asynchronously received. Passing 'middleware' using client.use() only prepares middleware for an outgoing request. Incoming responses are passed through callbacks attached with client.get() or client.post(). The response.use method makes it possible to assign middleware at client.use() that can also be called on a response.

Any middlware added by response.use() is called *before* other callbacks assigned by client.get(), etc.

For example, here is the json-parsing middleware that stringifies outgoing JSON and parses incoming JSON:

```javascript
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
```

# Middleware

A set of basic middleware is available on the main library function, ```var rest = require('rest-browser-client');```.

## rest.json()

Stringifies outgoing JSON and parses incoming JSON.

```javascript
client.use(rest.json(), function(req, res) {
    var str = req.body; // <-- This is now a JSON string
});

client.post({ first : 'Ben', last : 'Franklin'});

client.get(function(req, res){
    var obj = res.body; // <-- This is now a javascript object
});
```




