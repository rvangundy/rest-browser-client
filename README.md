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
    if (typeof req.data !== 'string') { req.data = JSON.stringify(req.data); }
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
