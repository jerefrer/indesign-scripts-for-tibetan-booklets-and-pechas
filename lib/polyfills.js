if (!Array.prototype.each) {
    Array.prototype.each = function(callback, thisArg) {
        if (this == null) {
            throw new TypeError('Array.prototype.each called on null or undefined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        var t = Object(this);
        var len = t.length >>> 0; // Convert length to a Uint32

        for (var i = 0; i < len; i++) {
            if (i in t) {
                // Call the callback function, passing the arguments: current value, index, the array itself
                callback.call(thisArg, t[i], i, t);
            }
        }
    };
}

if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        var O = Object(this);
        var len = O.length >>> 0;
        var A = new Array(len);
        var k = 0;

        while (k < len) {
            if (k in O) {
                var kValue = O[k];
                var mappedValue = callback.call(thisArg, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }

        return A;
    };
}

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate, thisArg) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };
}
