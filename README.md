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

### .use(middleware)

Attaches new 'middleware' to outgoing requests. Note that this does not work exactly like .use() in express. Middleware is called after an XHR connection has been opened, but before the actual request is sent. Middleware is often used for establishing headers on the request object. Additionally, event registration is also a good candidate for middleware, such as registering for progress updates. Note that a single .use() method may be used to register several middleware handlers.

The following example demonstrates some middleware for sending JSON to the server. Note that this differs from Connect middleware in which both a ```req``` and ```res``` object are used (*Note*: Inclusion of a response object is being considered). Middleware functions accept the request object as a parameter:

```javascript
client.use(function(req, next), {
    req.set('Content-Type', 'application/json');
    if (typeof req.data !== 'string') { req.data = JSON.stringify(req.data); }
    next();
});
```

It is also possible to register error handling middleware. In case of an error in an outgoing request, all middleware is skipped other than those for handling errors. To generate an error, pass a string or an error object in to the next() callback. Note that error-handling middleware *must* include ```err``` as its first parameter.

```javascript
client.use(function(err, req, next) {
    if (err) { console.log(err.message); }
    else { next(); }
});
```
