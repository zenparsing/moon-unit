/*=es6now=*/(function(fn, deps, name) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof __MODULE === 'function') __MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn.call(window, null, window[name] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 'use strict'; function __load(p) { var e = require(p); return typeof e === 'object' ? e : { module: e }; } var __this = this; var Promise__ = (function(exports) {

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
        
        if (value && typeof value.then === "function") {
        
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

	constructor: function(logger, done) {
	
		this._name = "";
		this._not = false;
		this._logger = logger;
		this._done = done;
		
		this.async = false;
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
	
	done: function() {
	
	    return this._done();
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

    constructor: function() {
    
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

var Style = (function(exports) {

    function green(msg) {
    
        return "\u001b[32m" + (msg) + "\u001b[39m";
    }
    
    function red(msg) {
    
        return "\u001b[31m" + (msg) + "\u001b[39m";
    }
    
    function gray(msg) {
    
        return "\u001b[90m" + (msg) + "\u001b[39m";
    }
    
    function bold(msg) {
    
        return "\u001b[1m" + (msg) + "\u001b[22m";
    }
exports.green = green; exports.red = red; exports.gray = gray; exports.bold = bold; return exports; }).call(this, {});

var NodeLogger = __class(function(__super) { return {

    constructor: function() {
    
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
            test = new Test(this.logger, (function(val) { return resolver.resolve(val); }));
        
        // Give the test a default name
        test.name(key);
        
        return Promise.resolve().then((function($) {
        
            node[key](test, __this.injections);
            
            if (!test.async)
                resolver.resolve(null);
            
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

var moonUnit = (function(exports) {

var TestRunner = TestRunner_.TestRunner;
var Logger = Logger_.Logger;

function runTests(tests) {

    return new TestRunner().run(tests);
}



exports.runTests = runTests; exports.TestRunner = TestRunner; return exports; }).call(this, {});

Object.keys(moonUnit).forEach(function(k) { exports[k] = moonUnit[k]; });


}, [], "");