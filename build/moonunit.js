/*=es6now=*/(function(fn, deps) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof MODULE === 'function') MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && "") fn.call(window, null, window[""] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 

var __modules = [], __exports = [], __global = this; 

function __require(i, obj) { 
    var e = __exports; 
    if (e[i] !== void 0) return e[i]; 
    __modules[i].call(__global, e[i] = (obj || {})); 
    return e[i]; 
} 

__modules[0] = function(exports) {
"use strict";

var Runner = __require(1).Runner;
var Logger = __require(4).Logger;

function run(tests) {

    return new Runner().run(tests);
}


exports.run = run;
exports.Runner = Runner;
};

__modules[1] = function(exports) {
var __this = this; "use strict";

var Promise = __require(2).Promise;
var Test = __require(3).Test;
var Logger = __require(4).Logger;

var Runner = es6now.Class(null, function(__super) { return {

    constructor: function() {
    
        this.logger = new Logger;
        this.injections = {};
    },
    
    inject: function(obj) { var __this = this; 
    
        Object.keys(obj || {}).forEach((function(k) { return __this.injections[k] = obj[k]; }));
        return this;
    },
    
    run: function(tests) { var __this = this; 
    
        this.logger.clear();
        
        return this._visit(tests).then((function(val) { 
        
            __this.logger.end();
            return __this;
        }));
    },
    
    _exec: function(node, key) { var __this = this; 
    
        var test = new Test((function(data) {  __this.logger.log(data); })),
            promise = new Promise;
        
        // Inject dependencies into test object
        Object.keys(this.injections).forEach((function(k) { 
        
            if (test[k] === void 0)
                test[k] = __this.injections[k];
        }));
        
        test.name(key);
        
        return Promise.when(null).then((function(val) { 
        
            if (node[key].length < 2) {
            
                node[key](test);
                promise.resolve(null);
                
            } else {
            
                node[key](test, (function(val) { return promise.resolve(val); }));
            }
            
            return promise.future;
        }));
    },
    
    _visit: function(node) { var __this = this; 
        
        return Object.keys(node).reduce((function(prev, k) { return prev.then((function(val) { 
            
            if (typeof node[k] === "function") {
        
                return __this._exec(node, k);
            
            } else {
            
                __this.logger.pushGroup(k);
                return __this._visit(node[k]).then((function(val) { return __this.logger.popGroup(); }));
            }
            
        })); }), Promise.when(null)).then((function(val) { return __this; }));
    }
}});

exports.Runner = Runner;
};

__modules[2] = function(exports) {
"use strict";

var identity = (function(obj) { return obj; }),
    freeze = Object.freeze || identity,
    queue = [],
    waiting = false,
    asap;

// UUID property names used for duck-typing
var DISPATCH = "07b06b7e-3880-42b1-ad55-e68a77514eb9",
    IS_FAILURE = "7d24bf0f-d8b1-4783-b594-cec32313f6bc";

var EMPTY_LIST_MSG = "List cannot be empty.",
    CYCLE_MSG = "A promise cycle was detected.";

var THROW_DELAY = 50;

// Enqueues a message
function enqueue(future, args) {

    queue.push({ fn: future[DISPATCH], args: args });
    
    if (!waiting) {
    
        waiting = true;
        asap(flush);
    }
}

// Flushes the message queue
function flush() {

    var msg, count;
    
    waiting = false;

    while (queue.length > 0) {
        
        // Send each message in queue
        for (count = queue.length; count > 0; --count) {
        
            msg = queue.shift();
            msg.fn.apply(void 0, msg.args);
        }
    }
}

// Returns a cycle error
function cycleError() {

    return failure(CYCLE_MSG);
}

// Future constructor
function Future(dispatch) {
    
    this[DISPATCH] = dispatch;
}

// Registers a callback for completion when a future is complete
Future.prototype.then = function then(onSuccess, onFail) {

    onSuccess || (onSuccess = identity);
    
    var resolve = (function(value) { return finish(value, onSuccess); }),
        reject = (function(value) { return finish(value, onFail); }),
        promise = new Promise(onQueue),
        target = this,
        done = false;
    
    onQueue(onSuccess, onFail);
    
    return promise.future;
    
    function onQueue(success, error) {
    
        if (success && resolve) {
        
            enqueue(target, [ resolve, null ]);
            resolve = null;
        }
        
        if (error && reject) {
        
            enqueue(target, [ null, reject ]);
            reject = null;
        }
    }
    
    function finish(value, transform) {
    
        if (!done) {
        
            done = true;
            promise.resolve(applyTransform(transform, value));
        }
    }
};

// Begins a deferred operation
function Promise(onQueue) {

    var token = {},
        pending = [],
        throwable = true,
        next = null;

    this.future = freeze(new Future(dispatch));
    this.resolve = resolve;
    this.reject = reject;
    
    freeze(this);
    
    // Dispatch function for future
    function dispatch(success, error, src) {
    
        var msg = [success, error, src || token];
        
        if (error)
            throwable = false;
        
        if (pending) {
        
            pending.push(msg);
            
            if (onQueue)
                onQueue(success, error);
        
        } else {
        
            // If a cycle is detected, convert resolution to a rejection
            if (src === token) {
            
                next = cycleError();
                maybeThrow();
            }
            
            enqueue(next, msg);
        }
    }
    
    // Resolves the promise
    function resolve(value) {
    
        var i, list;
    
        if (!pending)
            return;
        
        list = pending;
        pending = false;
        
        // Create a future from the provided value
        next = when(value);

        // Send internally queued messages to the next future
        for (i = 0; i < list.length; ++i)
            enqueue(next, list[i]);
        
        maybeThrow();
    }
    
    // Resolves the promise with a rejection
    function reject(error) {
    
        resolve(failure(error));
    }
    
    // Throws an error if the promise is rejected and there
    // are no error handlers
    function maybeThrow() {
    
        if (!throwable || !isFailure(next))
            return;
        
        setTimeout((function() { 
        
            var error = null;
            
            // Get the error value
            next[DISPATCH](null, (function(val) { return error = val; }));
            
            // Throw it
            if (error && throwable)
                throw error;
            
        }), THROW_DELAY);
    }
}

// Returns a future for an object
function when(obj) {

    if (obj && obj[DISPATCH])
        return obj;
    
    if (obj && obj.then) {
    
        var promise = new Promise();
        obj.then(promise.resolve, promise.reject);
        return promise.future;
    }
    
    // Wrap a value in an immediate future
    return freeze(new Future((function(success) { return success && success(obj); })));
}

// Returns true if the object is a failed future
function isFailure(obj) {

    return obj && obj[IS_FAILURE];
}

// Creates a failure Future
function failure(value) {

    var future = new Future((function(success, error) { return error && error(value); }));
    
    // Tag the future as a failure
    future[IS_FAILURE] = true;
    
    return freeze(future);
}

// Applies a promise transformation function
function applyTransform(transform, value) {

    try { return (transform || failure)(value); }
    catch (ex) { return failure(ex); }
}

// Returns a future for every completed future in an array
function whenAll(list) {

    var count = list.length,
        promise = new Promise(),
        out = [],
        i;
    
    for (i = 0; i < list.length; ++i)
        waitFor(list[i], i);
    
    if (count === 0)
        promise.resolve(out);
    
    return promise.future;
    
    function waitFor(f, index) {
    
        when(f).then((function(val) {  
        
            out[index] = val;
            
            if (--count === 0)
                promise.resolve(out);
        
        }), (function(err) { 
        
            promise.reject(err);
        }));
    }
}

// Returns a future for the first completed future in an array
function whenAny(list, onSuccess, onFail) {

    if (list.length === 0)
        throw new Error(EMPTY_LIST_MSG);
    
    var promise = new Promise(), i;
    
    for (i = 0; i < list.length; ++i)
        when(list[i]).then((function(val) { return promise.resolve(val); }), (function(err) { return promise.reject(err); }));
    
    return promise.future;
}

// === Event Loop API ===

asap = (function(global) { 
    
    var msg = uuid(),
        process = global.process,
        window = global.window,
        msgChannel = null,
        list = [];
    
    if (process && typeof process.nextTick === "function") {
    
        // NodeJS
        return process.nextTick;
   
    } else if (window && window.addEventListener && window.postMessage) {
    
        // Modern Browsers
        if (window.MessageChannel) {
        
            msgChannel = new window.MessageChannel();
            msgChannel.port1.onmessage = onmsg;
        
        } else {
        
            window.addEventListener("message", onmsg, true);
        }
        
        return (function(fn) { 
        
            list.push(fn);
            
            if (msgChannel !== null)
                msgChannel.port2.postMessage(msg);
            else
                window.postMessage(msg, "*");
            
            return 1;
        });
    
    } else {
    
        // Legacy
        return (function(fn) { return setTimeout(fn, 0); });
    }
        
    function onmsg(evt) {
    
        if (msgChannel || (evt.source === window && evt.data === msg)) {
        
            evt.stopPropagation();
            if (list.length) list.shift()();
        }
    }
    
    function uuid() {
    
        return [32, 16, 16, 16, 48].map((function(bits) { return rand(bits); })).join("-");
        
        function rand(bits) {
        
            if (bits > 32) 
                return rand(bits - 32) + rand(32);
            
            var str = (Math.random() * 0xffffffff >>> (32 - bits)).toString(16),
                len = bits / 4 >>> 0;
            
            if (str.length < len) 
                str = (new Array(len - str.length + 1)).join("0") + str;
            
            return str;
        }
    }
    
})(this);

Promise.when = when;
Promise.whenAny = whenAny;
Promise.whenAll = whenAll;
Promise.reject = failure;


exports.Promise = Promise;
};

__modules[3] = function(exports) {
"use strict";

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

var Test = es6now.Class(null, function(__super) { return {

	constructor: function(log) {
	
		this._name = "";
		this._not = false;
		this._log = log;
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
	
	equal: function(actual, expected) {
	
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
		
		this._log(obj);
		this._not = false;
		
		return this;
	}
}});

exports.Test = Test;
};

__modules[4] = function(exports) {
"use strict";

var HtmlLogger = __require(5).HtmlLogger;
var NodeLogger = __require(6).NodeLogger;

var Logger = (typeof this.process === "object" && process.cwd) ?
    NodeLogger :
    HtmlLogger;

exports.Logger = Logger;
};

__modules[5] = function(exports) {
"use strict";

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

var HtmlLogger = es6now.Class(null, function(__super) { return {

    constructor: function() {
    
        this.target = findTarget();
        this.clear();
    },
    
    clear: function() {
    
        this.depth = 0;
        this.html = "";
        
        if (this.target)
            this.target.innerHTML = "";
    },
    
    end: function() {
    
        this._flush();
    },
    
    pushGroup: function(name) {
    
        this.depth += 1;
        
        var line = "=".repeat(this.depth + 1);
        console.log("\n" + (line) + " " + (name) + " " + (line) + "");
        
        this._writeHeader(name, this.depth);
    },
    
    popGroup: function() {
    
        this.depth -= 1;
        this._flush();
    },
    
    log: function(result) {
    
        console.log("" + (result.name) + ": [" + (result.pass ? "OK" : "FAIL") + "]");
        
        this.html += 
        "<div class='" + (result.pass ? "pass" : "fail") + "'>\n            " + (result.name) + " <span class=\"status\">[" + (result.pass ? "OK" : "FAIL") + "]</span>\n        </div>";
    },
    
    error: function(err) {
    
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
exports.HtmlLogger = HtmlLogger;
};

__modules[6] = function(exports) {
"use strict";

var NodeLogger = es6now.Class(null, function(__super) { return {

    constructor: function() {
    
        this.clear();
    },
    
    clear: function() {
    
        this.depth = 0;
    },
    
    end: function() {
    
        // Empty
    },
    
    pushGroup: function(name) {
    
        this.depth += 1;
        var line = "=".repeat(this.depth + 1);
        console.log("\n" + (line) + " " + (name) + " " + (line) + "");
    },
    
    popGroup: function() {
    
        this.depth -= 1;
    },
    
    log: function(result) {
    
        console.log("" + (result.name) + ": [" + (result.pass ? "OK" : "FAIL") + "]");
    },
    
    error: function(err) {
    
    }
}});
exports.NodeLogger = NodeLogger;
};

__require(0, exports);


}, []);