if (typeof Function.prototype.bind !== 'function') {
    Function.prototype.bind = (function() {
        'use strict';

        var slice = Array.prototype.slice;
        return function (thisArg) {
            var target = this, boundArgs = slice.call(arguments, 1);

            if (typeof target !== 'function') { throw new TypeError(); }

            function bound() {
                var args = boundArgs.concat(slice.call(arguments));
                target.apply(this instanceof bound ? this : thisArg, args);
            }

            bound.prototype = (function F(proto) {
                    if (proto) { F.prototype = proto; }
                    if (!(this instanceof F)) { return new F(); }
                })(target.prototype);

            return bound;
        };
    }());
}
