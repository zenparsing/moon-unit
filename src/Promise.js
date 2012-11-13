"use strict";

var identity = obj => obj,
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
    this.then = (a, b) => when(this, a, b);
}

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
        next = toFuture(value);

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
        
        setTimeout(() => {
        
            var error = null;
            
            // Get the error value
            next[DISPATCH](null, val => error = val);
            
            // Throw it
            if (error && throwable)
                throw error;
            
        }, THROW_DELAY);
    }
}

// Coerces an object to a future
function toFuture(obj) {

    if (obj && obj[DISPATCH])
        return obj;
    
    if (obj && obj.then) {
    
        var promise = new Promise();
        obj.then(promise.resolve, promise.reject);
        return promise.future;
    }
    
    // Wrap a value in an immediate future
    return freeze(new Future(success => success && success(obj)));
}

// Returns true if the object is a failed future
function isFailure(obj) {

    return obj && obj[IS_FAILURE];
}

// Creates a failure Future
function failure(value) {

    var future = new Future((success, error) => error && error(value));
    
    // Tag the future as a failure
    future[IS_FAILURE] = true;
    
    return freeze(future);
}

// Registers a callback for completion when a future is complete
function when(obj, onSuccess, onFail) {
    
    onSuccess || (onSuccess = identity);
    
    var resolve = value => finish(value, onSuccess),
        reject = value => finish(value, onFail),
        promise = new Promise(onQueue),
        target = toFuture(obj),
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
    
        when(f, val => { 
        
            out[index] = val;
            
            if (--count === 0)
                promise.resolve(out);
        
        }, err => {
        
            promise.reject(err);
        });
    }
}

// Returns a future for the first completed future in an array
function whenAny(list) {

    if (list.length === 0)
        throw new Error(EMPTY_LIST_MSG);
    
    var promise = new Promise(), i;
    
    for (i = 0; i < list.length; ++i)
        when(list[i], val => promise.resolve(val), err => promise.reject(err));
    
    return promise.future;
}

// === Event Loop API ===

asap = global => {
    
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
        
        return fn => {
        
            list.push(fn);
            
            if (msgChannel !== null)
                msgChannel.port2.postMessage(msg);
            else
                window.postMessage(msg, "*");
            
            return 1;
        };
    
    } else {
    
        // Legacy
        return fn => setTimeout(fn, 0);
    }
        
    function onmsg(evt) {
    
        if (msgChannel || (evt.source === window && evt.data === msg)) {
        
            evt.stopPropagation();
            if (list.length) list.shift()();
        }
    }
    
    function uuid() {
    
        return [32, 16, 16, 16, 48].map(bits => rand(bits)).join("-");
        
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
    
}(this);

Promise.when = when;
Promise.whenAny = whenAny;
Promise.whenAll = whenAll;
Promise.failure = failure;

export Promise;