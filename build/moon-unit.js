/*=es6now=*/(function(fn, deps, name) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof __MODULE === 'function') __MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn.call(window, null, window[name] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 'use strict'; function __load(p) { var e = require(p); return typeof e === 'object' ? e : { 'default': e }; } 

var __this = this; (function() {

var HOP = Object.prototype.hasOwnProperty,
    STATIC = /^__static_/;

// Returns true if the object has the specified property
function hasOwn(obj, name) {

    return HOP.call(obj, name);
}

// Returns true if the object has the specified property in
// its prototype chain
function has(obj, name) {

    for (; obj; obj = Object.getPrototypeOf(obj))
        if (HOP.call(obj, name))
            return true;
    
    return false;
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {

    var names = Object.getOwnPropertyNames(obj);
    
    for (var i = 0, name; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));
    
    return obj;
}

// Performs copy-based inheritance
function inherit(to, from) {

    for (; from; from = Object.getPrototypeOf(from)) {
    
        forEachDesc(from, (function(name, desc) {
        
            if (!has(to, name))
                Object.defineProperty(to, name, desc);
        }));
    }
    
    return to;
}

function defineMethods(to, from, classMethods) {

    forEachDesc(from, (function(name, desc) {
    
        if (STATIC.test(name) === classMethods)
            Object.defineProperty(to, classMethods ? name.replace(STATIC, "") : name, desc);
    }));
    
    return to;
}

function Class(base, def) {

    function constructor() { 
    
        if (parent && parent.constructor)
            parent.constructor.apply(this, arguments);
    }
    
    var parent;
    
    if (def === void 0) {
    
        // If no base class is specified, then Object.prototype
        // is the parent prototype
        def = base;
        base = null;
        parent = Object.prototype;
    
    } else if (base === null) {
    
        // If the base is null, then then then the parent prototype is null
        parent = null;
        
    } else if (typeof base === "function") {
    
        parent = base.prototype;
        
        // Prototype must be null or an object
        if (parent !== null && Object(parent) !== parent)
            parent = void 0;
    }
    
    if (parent === void 0)
        throw new TypeError();
    
    // Generate the method collection, closing over "super"
    var props = def(parent);
    
    // Get constructor
    if (hasOwn(props, "constructor"))
        constructor = props.constructor;
    
    // Make constructor non-enumerable and assign a default
    // if none is provided
    Object.defineProperty(props, "constructor", {
    
        enumerable: false,
        writable: true,
        configurable: true,
        value: constructor
    });
    
    // Create prototype object
    var proto = defineMethods(Object.create(parent), props, false);
    
    // Set constructor's prototype
    constructor.prototype = proto;
    
    // Set class "static" methods
    defineMethods(constructor, props, true);
    
    // "Inherit" from base constructor
    if (base) inherit(constructor, base);
    
    return constructor;
}

this.__class = Class;


}).call(this);

(function() {

/*

Provides basic support for methods added in EcmaScript 5 for EcmaScript 4 browsers.
The intent is not to create 100% spec-compatible replacements, but to allow the use
of basic ES5 functionality with predictable results.  There are features in ES5 that
require an ES5 engine (freezing an object, for instance).  If you plan to write for 
legacy engines, then don't rely on those features.

*/

var global = this,
    OP = Object.prototype,
    HOP = OP.hasOwnProperty,
    slice = Array.prototype.slice,
    TRIM_S = /^s+/,
    TRIM_E = /s+$/,
    FALSE = function() { return false; },
    TRUE = function() { return true; },
    identity = function(o) { return o; },
    defGet = OP.__defineGetter__,
    defSet = OP.__defineSetter__,
    keys = Object.keys || es4Keys,
    ENUM_BUG = !function() { var o = { constructor: 1 }; for (var i in o) return i = true; }(),
    ENUM_BUG_KEYS = [ "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor" ],
    ERR_REDUCE = "Reduce of empty array with no initial value";

// Returns the internal class of an object
function getClass(o) {

    if (o === null || o === undefined) return "Object";
    return OP.toString.call(o).slice("[object ".length, -1);
}

// Returns an array of keys defined on the object
function es4Keys(o) {

    var a = [], i;
    
    for (i in o)
        if (HOP.call(o, i))
            a.push(i);
    
    if (ENUM_BUG) 
        for (i = 0; i < ENUM_BUG_KEYS.length; ++i)
            if (HOP.call(o, ENUM_BUG_KEYS[i]))
                a.push(ENUM_BUG_KEYS[i]);
    
    return a;
}

// Sets a collection of keys, if the property is not already set
function addKeys(o, p) {

    for (var i = 0, a = keys(p), k; i < a.length; ++i) {
    
        k = a[i];
        
        if (o[k] === undefined) 
            o[k] = p[k];
    }
    
    return o;
}


// In IE8, defineProperty and getOwnPropertyDescriptor only work on DOM objects
// and are therefore useless - so bury them.
try { (Object.defineProperty || FALSE)({}, "-", { value: 0 }); }
catch (x) { Object.defineProperty = undefined; };

try { (Object.getOwnPropertyDescriptor || FALSE)({}, "-"); }
catch (x) { Object.getOwnPropertyDescriptor = undefined; }

// In IE < 9 [].slice does not work properly when the start or end arguments are undefined.
try { [0].slice(0, undefined)[0][0]; }
catch (x) {

    Array.prototype.slice = function(s, e) {
    
        s = s || 0;
        return (e === undefined ? slice.call(this, s) : slice.call(this, s, e));
    };
}

// ES5 Object functions
addKeys(Object, {

    create: function(o, p) {
    
        var n;
        
        if (o === null) {
        
            n = { "__proto__": o };
        
        } else {
        
            var f = function() {};
            f.prototype = o;
            n = new f;
        }
        
        if (p !== undefined)
            Object.defineProperties(n, p);
        
        return n;
    },
    
    keys: keys,
    
    getOwnPropertyDescriptor: function(o, p) {
    
        if (!HOP.call(o, p))
            return undefined;
        
        return { 
            value: o[p], 
            writable: true, 
            configurable: true, 
            enumerable: OP.propertyIsEnumerable.call(o, p)
        };
    },
    
    defineProperty: function(o, n, p) {
    
        var msg = "Accessor properties are not supported.";
        
        if ("get" in p) {
        
            if (defGet) defGet(n, p.get);
            else throw new Error(msg);
        }
        
        if ("set" in p) {
        
            if (defSet) defSet(n, p.set);
            else throw new Error(msg);
        }
        
        if ("value" in p)
            o[n] = p.value;
        
        return o;
    },
    
    defineProperties: function(o, d) {
    
        Object.keys(d).forEach(function(k) { Object.defineProperty(o, k, d[k]); });
        return o;
    },
    
    getPrototypeOf: function(o) {
    
        var p = o.__proto__ || o.constructor.prototype;
        return p;
    },
    
    /*
    
    getOwnPropertyNames is buggy since there is no way to get non-enumerable 
    ES3 properties.
    
    */
    
    getOwnProperyNames: keys,
    
    freeze: identity,
    seal: identity,
    preventExtensions: identity,
    isFrozen: FALSE,
    isSealed: FALSE,
    isExtensible: TRUE
    
});


// Add ES5 String extras
addKeys(String.prototype, {

    trim: function() { return this.replace(TRIM_S, "").replace(TRIM_E, ""); }
});


// Add ES5 Array extras
addKeys(Array, {

    isArray: function(obj) { return getClass(obj) === "Array"; }
});


addKeys(Array.prototype, {

    indexOf: function(v, i) {
    
        var len = this.length >>> 0;
        
        i = i || 0;
        if (i < 0) i = Math.max(len + i, 0);
        
        for (; i < len; ++i)
            if (this[i] === v)
                return i;
        
        return -1;
    },
    
    lastIndexOf: function(v, i) {
    
        var len = this.length >>> 0;
        
        i = Math.min(i || 0, len - 1);
        if (i < 0) i = len + i;
        
        for (; i >= 0; --i)
            if (this[i] === v)
                return i;
        
        return -1;
    },
    
    every: function(fn, self) {
    
        var r = true;
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && !(r = fn.call(self, this[i], i, this)))
                break;
        
        return !!r;
    },
    
    some: function(fn, self) {
    
        var r = false;
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && (r = fn.call(self, this[i], i, this)))
                break;
        
        return !!r;
    },
    
    forEach: function(fn, self) {
    
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this)
                fn.call(self, this[i], i, this);
    },
    
    map: function(fn, self) {
    
        var a = [];
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this)
                a[i] = fn.call(self, this[i], i, this);
        
        return a;
    },
    
    filter: function(fn, self) {
    
        var a = [];
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && fn.call(self, this[i], i, this))
                a.push(this[i]);
        
        return a;
    },
    
    reduce: function(fn) {
    
        var len = this.length >>> 0,
            i = 0, 
            some = false,
            ini = (arguments.length > 1),
            val = (ini ? arguments[1] : this[i++]);
        
        for (; i < len; ++i) {
        
            if (i in this) {
            
                some = true;
                val = fn(val, this[i], i, this);
            }
        }
        
        if (!some && !ini)
            throw new TypeError(ERR_REDUCE);
        
        return val;
    },
    
    reduceRight: function(fn) {
    
        var len = this.length >>> 0,
            i = len - 1,
            some = false,
            ini = (arguments.length > 1),
            val = (ini || i < 0  ? arguments[1] : this[i--]);
        
        for (; i >= 0; --i) {
        
            if (i in this) {
            
                some = true;
                val = fn(val, this[i], i, this);
            }
        }
        
        if (!some && !ini)
            throw new TypeError(ERR_REDUCE);
        
        return val;
    }
});

// Add ES5 Function extras
addKeys(Function.prototype, {

    bind: function(self) {
    
        var f = this,
            args = slice.call(arguments, 1),
            noargs = (args.length === 0);
        
        bound.prototype = f.prototype;
        return bound;
        
        function bound() {
        
            return f.apply(
                this instanceof bound ? this : self, 
                noargs ? arguments : args.concat(slice.call(arguments, 0)));
        }
    }
});

// Add ES5 Date extras
addKeys(Date, {

    now: function() { return (new Date()).getTime(); }
});

// Add ES5 Date extras
addKeys(Date.prototype, {

    toISOString: function() {
    
        function pad(s) {
        
            if ((s = "" + s).length === 1) s = "0" + s;
            return s;
        }
        
        return this.getUTCFullYear() + "-" +
            pad(this.getUTCMonth() + 1, 2) + "-" +
            pad(this.getUTCDate(), 2) + "T" +
            pad(this.getUTCHours(), 2) + ":" +
            pad(this.getUTCMinutes(), 2) + ":" +
            pad(this.getUTCSeconds(), 2) + "Z";
    },
    
    toJSON: function() {
    
        return this.toISOString();
    }
});

// Add ISO support to Date.parse
if (Date.parse(new Date(0).toISOString()) !== 0) !function() {

    /*
    
    In ES5 the Date constructor will also parse ISO dates, but overwritting 
    the Date function itself is too far.  Note that new Date(isoDateString)
    is not backward-compatible.  Use the following instead:
    
    new Date(Date.parse(dateString));
    
    1: +/- year
    2: month
    3: day
    4: hour
    5: minute
    6: second
    7: fraction
    8: +/- tz hour
    9: tz minute
    
    */
    
    var isoRE = /^(?:((?:[+-]d{2})?d{4})(?:-(d{2})(?:-(d{2}))?)?)?(?:T(d{2}):(d{2})(?::(d{2})(?:.d{3})?)?)?(?:Z|([-+]d{2}):(d{2}))?$/,
        dateParse = Date.parse;

    Date.parse = function(s) {
    
        var t, m, hasDate, i, offset;
        
        if (!isNaN(t = dateParse(s)))
            return t;
        
        if (s && (m = isoRE.exec(s))) {
        
            hasDate = m[1] !== undefined;
            
            // Convert matches to numbers (month and day default to 1)
            for (i = 1; i <= 9; ++i)
                m[i] = Number(m[i] || (i <= 3 ? 1 : 0));
            
            // Calculate ms directly if no date is provided
            if (!hasDate)
                return ((m[4] * 60 + m[5]) * 60 + m[6]) * 1000 + m[7];
            
            // Convert month to zero-indexed
            m[2] -= 1;
            
            // Get TZ offset
            offset = (m[8] * 60 + m[9]) * 60 * 1000;
            
            // Remove full match from array
            m.shift();
            
            t = Date.UTC.apply(this, m) + offset;
        }
        
        return t;
    };
            
}();


}).call(this);

(function() {

var global = this,
    HAS_OWN = Object.prototype.hasOwnProperty;

function addProps(obj, props) {

    Object.keys(props).forEach((function(k) {
    
        if (typeof obj[k] !== "undefined")
            return;
        
        Object.defineProperty(obj, k, {
        
            value: props[k],
            configurable: true,
            enumerable: false,
            writable: true
        });
    }));
}

addProps(Object, {

    is: function(a, b) {
    
        // TODO
    },
    
    assign: function(target, source) {
    
        Object.keys(source).forEach((function(k) { return target[k] = source[k]; }));
        return target;
    },
    
    mixin: function(target, source) {
    
        Object.getOwnPropertyNames(source).forEach((function(name) {
        
            var desc = Object.getOwnPropertyDescriptor(source, name);
            Object.defineProperty(target, name, desc);
        }));
        
        return target;
    }
});

addProps(Number, {

    EPSILON: Number.EPSILON || (function() {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
    }()),
    
    MAX_INTEGER: 9007199254740992,
    
    isFinite: function(val) {
        
        return typeof val === "number" && isFinite(val);
    },
    
    isNaN: function(val) {
    
        return typeof val === "number" && isNaN(val);
    },
    
    isInteger: function(val) {
    
        typeof val === "number" && val | 0 === val;
    },
    
    toInteger: function(val) {
        
        return val | 0;
    }
});

addProps(Array, {

    from: function(arg) {
        // TODO
    },
    
    of: function() {
        // ?
    }

});

addProps(String.prototype, {
    
    repeat: function(count) {
    
        return new Array(count + 1).join(this);
    },
    
    startsWith: function(search, start) {
    
        return this.indexOf(search, start) === start;
    },
    
    endsWith: function(search, end) {
    
        return this.slice(-search.length) === search;
    },
    
    contains: function(search, pos) {
    
        return this.indexOf(search, pos) !== -1;
    }
});

if (typeof Reflect === "undefined") global.Reflect = {

    hasOwn: function(obj, name) { return HAS_OWN.call(obj, name); }
};


}).call(this);

var Promise__ = (function(exports) {

var EventLoop = (function(exports) {

    var queueOuter;
    
    var process = this.process,
        window = this.window,
        msgChannel = null,
        list = [];
    
    if (process && typeof process.nextTick === "function") {
    
        queueOuter = process.nextTick;
        
    } else if (typeof setImmediate === "function") {
    
        queueOuter = window ?
            window.setImmediate.bind(window) :
            setImmediate;
   
    } else if (window && window.MessageChannel) {
        
        msgChannel = new window.MessageChannel();
        msgChannel.port1.onmessage = (function($) { if (list.length) list.shift()(); });
    
        queueOuter = (function(fn) {
        
            list.push(fn);
            msgChannel.port2.postMessage(0);
        });
    
    } else {
    
        queueOuter = (function(fn) { return setTimeout(fn, 0); });
    }
exports.queueOuter = queueOuter; return exports; }).call(this, {});

var queueOuter = EventLoop.queueOuter;

var queue = [],
    throwList = [],
    waiting = false;

var PENDING = 0,
    FULFILLED = 1,
    REJECTED = 2;

// Enqueues a future callback dispatch
function enqueue(fn) {

    queue.push(fn);
    
    if (!waiting) {
    
        waiting = true;
        queueOuter(flush);
    }
}

// Flushes the message queue
function flush() {

    var count;
    
    // Send each message in queue
    while (queue.length > 0)
        for (count = queue.length; count > 0; --count)
            queue.shift()();
    
    waiting = false;
    
    checkpoint();
}

// Forces a checkpoint on the future graph, throwing an error
// if any rejected nodes do not have outgoing edges
function checkpoint() {

    var item;

    while (throwList.length) {
    
        item = throwList.shift();
        
        if (item.resolver.throwable)
            throw item.error;
    }
}

// Returns true if the object is a promise
function isPromise(value) {
    
    return value && typeof value.then === "function";
}

// Promise class
function Promise(init) {

    var fulfillList = [],
        rejectList = [],
        value = null,
        state = PENDING,
        future = this,
        resolver;

    this.then = then;
    this.catch = (function(onReject) { return then(null, onReject); });
    
    init.call(this, resolver = { fulfill: fulfill, resolve: resolve, reject: reject, throwable: false });

    // Dispatch function for future
    function dispatch() {

        var list = state === FULFILLED ? fulfillList : rejectList;
        
        while (list.length)
            list.shift()(value);
        
        fulfillList = [];
        rejectList = [];
    }
    
    // Resolves the future with a value
    function fulfill(val) {
    
        if (state) return;
        
        value = val;
        state = FULFILLED;
        enqueue(dispatch);
    }

    // Resolves the future
    function resolve(value) {

        if (state) return;
        
        if (isPromise(value)) {
        
            try { value.then(fulfill, reject); }
            catch (ex) { reject(ex); }
            
        } else {
        
            fulfill(value);
        }
    }

    // Resolves the future with an error
    function reject(error) {

        if (state) return;
        
        value = error;
        state = REJECTED;
        enqueue(dispatch);
        
        if (resolver.throwable)
            throwList.push({ resolver: resolver, error: error });
    }
    
    // Chains a future
    function then(onFulfill, onReject) {
    
        if (typeof onFulfill !== "function") onFulfill = null;
        if (typeof onReject !== "function") onReject = null;
            
        var done = false,
            resolveNext,
            rejectNext;
        
        var next = new Promise((function(r) {
        
            // Nodes with incomming edges are throwable
            r.throwable = true;
            resolveNext = r.resolve;
            rejectNext = r.reject;
        }));
        
        // Nodes with outgoing edges are not throwable
        resolver.throwable = false;
        
        // Add sucess and error handlers
        fulfillList.push((function(value) { return transform(value, false); }));
        rejectList.push((function(value) { return transform(value, true); }));
        
        // Dispatch handlers if future is resolved
        if (state) enqueue(dispatch);
        
        return next;
        
        function transform(value, rejected) {
        
            if (done) return;
            done = true;
           
            var fn = rejected ? onReject : onFulfill;
            
            if (fn) {
            
                try { 
                
                    value = fn.call(next, value);
                    rejected = false;
                
                } catch (ex) { 
                
                    value = ex;
                    rejected = true;
                }
            }
            
            if (rejected) rejectNext(value);
            else resolveNext(value);
        }
    }
}

Promise.resolve = (function(value) { return new Promise((function(r) { return r.resolve(value); })); });

Promise.fulfill = (function(value) { return new Promise((function(r) { return r.fulfill(value); })); });

Promise.reject = (function(value) { return new Promise((function(r) { return r.reject(value); })); });

// Recursively unwraps a promise
function unwrap(value) {

    return Promise.resolve(value).then((function(v) { return isPromise(v) ? unwrap(v) : v; }));
}

Promise.when = (function(value) { return unwrap(value); });

Promise.any = (function(values) { return new Promise((function(resolver) {

    var empty = true;
    
    values.forEach((function(value) {
    
        empty = false;
        Promise.resolve(value).then(resolver.resolve, resolver.reject);
    }));
    
    if (empty) 
        resolver.resolve(void 0);
})); });

Promise.all = (function(values) { return new Promise((function(resolver) {

    var results = [],
        remaining = 0;
    
    values.forEach((function(value, index) {
    
        ++remaining;
        
        Promise.resolve(value).then((function(v) {
        
            results[index] = v;
            
            if (--remaining === 0)
                resolver.resolve(results);
        
        }), resolver.reject);
    }));
    
    if (remaining === 0) 
        resolver.resolve(void 0);
})); });

Promise.some = (function(values) { return new Promise((function(resolver) {

    var errors = [],
        remaining = 0;
    
    values.forEach((function(value, index) {
    
        ++remaining;
        
        Promise.resolve(value).then(resolver.resolve, (function(err) {
        
            errors[index] = err;
            
            if (--remaining === 0)
                resolver.reject(errors);
        }));
    }));
    
    if (remaining === 0) 
        resolver.resolve(void 0);
})); });


exports.Promise = Promise; return exports; }).call(this, {});

var PromiseFlow = (function(exports) {

var Promise = Promise__.Promise;

function iterate(fn) {

    var done = false,
        stop = (function(val) { done = true; return val; }),
        next = (function(last) { return done ? last : Promise.resolve(fn(stop)).then(next); });
    
    return Promise.resolve().then(next);
}

function forEach(list, fn) {

    var i = -1;
    return iterate((function(stop) { return (++i >= list.length) ? stop() : fn(list[i], i, list); }));
}


exports.iterate = iterate; exports.forEach = forEach; return exports; }).call(this, {});

var Promise_ = (function(exports) {

Object.keys(Promise__).forEach(function(k) { exports[k] = Promise__[k]; });
Object.keys(PromiseFlow).forEach(function(k) { exports[k] = PromiseFlow[k]; });

return exports; }).call(this, {});

var Test_ = (function(exports) {

var OP_toString = Object.prototype.toString,
    OP_hasOwnProperty = Object.prototype.hasOwnProperty;

// Returns the internal class of an object
function getClass(o) {

	if (o === null || o === undefined) return "Object";
	return OP_toString.call(o).slice("[object ".length, -1);
}

// Returns true if the argument is a Date object
function isDate(obj) {

    return getClass(obj) === "Date";
}

// Returns true if the argument is an object
function isObject(obj) {

    return obj && typeof obj === "object";
}

// Returns true if the arguments are "equal"
function equal(a, b) {

	if (a === b)
		return true;

	// Dates must have equal time values
	if (isDate(a) && isDate(b))
		return a.getTime() === b.getTime();
	
	// Non-objects must be strictly equal (types must be equal)
	if (!isObject(a) || !isObject(b))
		return a === b;
	
	// Prototypes must be identical.  getPrototypeOf may throw on
	// ES3 engines that don't provide access to the prototype.
	try {
	
	    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
		    return false;
	
	} catch (err) {}
	
	var aKeys = Object.keys(a),
		bKeys = Object.keys(b),
		i;
	
	// Number of own properties must be identical
	if (aKeys.length !== bKeys.length)
		return false;
	
	for (i = 0; i < aKeys.length; ++i) {
	
		// Names of own properties must be identical
		if (!OP_hasOwnProperty.call(b, aKeys[i]))
			return false;
		
		// Values of own properties must be equal
		if (!equal(a[aKeys[i]], b[aKeys[i]]))
			return false;
	}
	
	return true;
}

var Test = __class(function(__super) { return {

	constructor: function Test(logger) {
	
		this._name = "";
		this._not = false;
		this._logger = logger;
	},
	
	_: function(name) {
	
	    this._name = name;
	    return this;
	},
	
	name: function(name) {
	
		this._name = name;
		return this;
	},
	
	not: function() {
	
		this._not = !this._not;
		return this;
	},
	
	assert: function(val) {
	
		return this._assert(val, {
		
			method: "assert"
		});
	},
	
	equals: function(actual, expected) {
	
		return this._assert(equal(actual, expected), {
		
			actual: actual,
			expected: expected,
			method: "equal"
		});
	},
	
	throws: function(type, fn) {
	
		if (!fn) {
		
			fn = type;
			type = null;
		}
		
		var threw = false;
		
		// TODO: Most errors will just be of type "Error".  How can
		// we communicate type information, then?
		
		try { fn(); } 
		catch (x) { threw = (!type || x instanceof type); }
		
		return this._assert(threw, {
		
			method: "throws"
		});
	},
	
	comment: function(msg) {
	
	    this._logger.comment(msg);
	},
	
	_assert: function(pred, data) {
	
		var pass = !!pred, 
			method = data.method || "",
			obj;
		
		if (this._not) {
		
			pass = !pass;
			method = "not " + method;
		}
		
		obj = { name: this._name, pass: pass, method: method };
		Object.keys(data).forEach((function(k) { return obj[k] || (obj[k] = data[k]); }));
		
		this._logger.log(obj);
		this._not = false;
		
		return this;
	}
	
}});


exports.Test = Test; return exports; }).call(this, {});

var HtmlLogger_ = (function(exports) {

var console = this.console || { log: function() {} },
    window = this.window;

var ELEMENT_ID = "unit-test-output";

function findTarget() {

    var e;
    
    for (var w = window; w; w = w.parent) {
    
        e = w.document.getElementById(ELEMENT_ID);
        
        if (e)
            return e;
    }
    
    return null;
}

var HtmlLogger = __class(function(__super) { return {

    constructor: function HtmlLogger() {
    
        this.target = findTarget();
        this.clear();
    },
    
    clear: function() {
    
        this.depth = 0;
        this.passed = 0;
        this.failed = 0;
        this.html = "";
        
        if (this.target)
            this.target.innerHTML = "";
    },
    
    end: function() {
    
        this._flush();
    },
    
    pushGroup: function(name) {
    
        this.depth += 1;
        
        this._writeHeader(name, this.depth);
    },
    
    popGroup: function() {
    
        this.depth -= 1;
        this._flush();
    },
    
    log: function(result) {
    
        var passed = !!result.pass;
        
        if (passed) this.passed++;
        else this.failed++;
        
        this.html += 
        "<div class='" + (result.pass ? "pass" : "fail") + "'>\n            " + (result.name) + " <span class=\"status\">[" + (passed ? "OK" : "FAIL") + "]</span>\n        </div>";
    },
    
    comment: function(msg) {
    
        this.html += "<p class=\"comment\">" + (msg) + "</p>";
    },
    
    _writeHeader: function(name) {
    
        var level = Math.min(Math.max(2, this.depth + 1), 6);
        this.html += "<h" + (level) + ">" + (name) + "</h" + (level) + ">";
    },
    
    _flush: function() {
    
        if (!this.target)
            return;
        
        var document = this.target.ownerDocument,
            div = document.createElement("div"), 
            frag = document.createDocumentFragment(),
            child;
        
        div.innerHTML = this.html;
        this.html = "";
        
        while (child = div.firstChild)
            frag.appendChild(child);
        
        if (this.target)
            this.target.appendChild(frag);
        
        div = null;
    }
}});

exports.HtmlLogger = HtmlLogger; return exports; }).call(this, {});

var NodeLogger_ = (function(exports) {

var Style = {

    green: function(msg) { return "\u001b[32m" + (msg) + "\u001b[39m" },
    red: function(msg) { return "\u001b[31m" + (msg) + "\u001b[39m" },
    gray: function(msg) { return "\u001b[90m" + (msg) + "\u001b[39m" },
    bold: function(msg) { return "\u001b[1m" + (msg) + "\u001b[22m" }
}

var NodeLogger = __class(function(__super) { return {

    constructor: function NodeLogger() {
    
        this.clear();
    },
    
    clear: function() {
    
        this.depth = 0;
        this.passed = 0;
        this.failed = 0;
        this.margin = false;
    },
    
    get indent() {
    
        return " ".repeat(Math.max(this.depth, 0) * 2);
    },
    
    end: function() {
    
        // Empty
    },
    
    pushGroup: function(name) {
        
        this._newline();
        this._write(Style.bold("" + (this.indent) + "" + (name) + ""));
        
        this.depth += 1;
    },
    
    popGroup: function() {
    
        this.depth -= 1;
    },
    
    log: function(result) {
    
        var passed = !!result.pass;
        
        if (passed) this.passed++;
        else this.failed++;
        
        this._write("" + (this.indent) + "" + (result.name) + " " + (passed ? Style.green("OK") : Style.red("FAIL")) + "");
    },
    
    comment: function(msg) {
    
        this._newline();
        this._write(this.indent + Style.gray(msg));
        this._newline();
    },
    
    _write: function(text) {
    
        console.log(text);
        this.margin = false;
    },
    
    _newline: function() {
    
        if (!this.margin)
            console.log("");
        
        this.margin = true;
    }
}});

exports.NodeLogger = NodeLogger; return exports; }).call(this, {});

var Logger_ = (function(exports) {

var HtmlLogger = HtmlLogger_.HtmlLogger;
var NodeLogger = NodeLogger_.NodeLogger;

var Logger = (typeof this.process === "object" && process.cwd) ?
    NodeLogger :
    HtmlLogger;


exports.Logger = Logger; return exports; }).call(this, {});

var TestRunner_ = (function(exports) {

var Promise = Promise_.Promise, forEachPromise = Promise_.forEach;
var Test = Test_.Test;
var Logger = Logger_.Logger;

var TestRunner = __class(function(__super) { return {

    constructor: function TestRunner() {
    
        this.logger = new Logger;
        this.injections = {};
    },
    
    inject: function(obj) { var __this = this; 
    
        Object.keys(obj || {}).forEach((function(k) { return __this.injections[k] = obj[k]; }));
        return this;
    },
    
    run: function(tests) { var __this = this; 
    
        this.logger.clear();
        this.logger.comment("Starting tests...");
        
        return this._visit(tests).then((function(val) {
        
            __this.logger.comment("Passed " + (__this.logger.passed) + " tests and failed " + (__this.logger.failed) + " tests.");
            __this.logger.end();
            return __this;
        }));
    },
    
    _exec: function(node, key) { var __this = this; 
    
        var resolver, 
            promise = new Promise((function(r) { return resolver = r; })),
            test = new Test(this.logger);
        
        // Give the test a default name
        test.name(key);
        
        return Promise.resolve().then((function($) {
        
            resolver.resolve(node[key](test, __this.injections));    
            return promise;
        }));
    },
    
    _visit: function(node) { var __this = this; 
        
        return forEachPromise(Object.keys(node), (function(k) {
        
            __this.logger.pushGroup(k);
            
            return (typeof node[k] === "function" ?
                __this._exec(node, k) :
                __this._visit(node[k])
            ).then((function($) { return __this.logger.popGroup(); }));
        }));
    }
}});


exports.TestRunner = TestRunner; return exports; }).call(this, {});

var main = (function(exports) {

var TestRunner = TestRunner_.TestRunner;
var Logger = Logger_.Logger;

function runTests(tests) {

    return new TestRunner().run(tests);
}




exports.runTests = runTests; exports.TestRunner = TestRunner; return exports; }).call(this, {});

Object.keys(main).forEach(function(k) { exports[k] = main[k]; });


}, [], "");