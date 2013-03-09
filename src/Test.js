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

export class Test {

	constructor(opt) {
	
	    
	
		this._name = "";
		this._not = false;
		this._log = opt.log;
		this._done = opt.done;
		
		this.async = false;
	}
	
	_(name) {
	    this._name = name;
	    return this;
	}
	
	name(name) {
	
		this._name = name;
		return this;
	}
	
	not() {
	
		this._not = !this._not;
		return this;
	}
	
	done() {
	
	    return this._done();
	}
	
	assert(val) {
	
		return this._assert(val, {
		
			method: "assert"
		});
	}
	
	equals(actual, expected) {
	
		return this._assert(equal(actual, expected), {
		
			actual: actual,
			expected: expected,
			method: "equal"
		});
	}
	
	throws(type, fn) {
	
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
	}
	
	_assert(pred, data) {
	
		var pass = !!pred, 
			method = data.method || "",
			obj;
		
		if (this._not) {
		
			pass = !pass;
			method = "not " + method;
		}
		
		obj = { name: this._name, pass: pass, method: method };
		Object.keys(data).forEach(k => obj[k] || (obj[k] = data[k]));
		
		this._log(obj);
		this._not = false;
		
		return this;
	}
	
}
