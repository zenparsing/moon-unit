"use strict";

import Promise from "Promise.js";
import Test from "Test.js";
import Logger from "Logger.js";

export class Runner {

    constructor() {
    
        this.logger = new Logger;
        this.injections = {};
    }
    
    inject(obj) {
    
        Object.keys(obj || {}).forEach(k => this.injections[k] = obj[k]);
        return this;
    }
    
    run(tests) {
    
        this.logger.clear();
        
        return this._visit(tests).then(val => {
        
            this.logger.end();
            return this;
        });
    }
    
    _exec(node, key) {
    
        var test = new Test(data => { this.logger.log(data); }),
            promise = new Promise;
        
        // Inject dependencies into test object
        Object.keys(this.injections).forEach(k => {
        
            if (test[k] === void 0)
                test[k] = this.injections[k];
        });
        
        test.name(key);
        
        return Promise.when(null).then(val => {
        
            if (node[key].length < 2) {
            
                node[key](test);
                promise.resolve(null);
                
            } else {
            
                node[key](test, promise.resolve);
            }
            
            return promise.future;
        });
    }
    
    _visit(node) {
        
        return Object.keys(node).reduce((prev, k) => prev.then(val => {
            
            if (typeof node[k] === "function") {
        
                return this._exec(node, k);
            
            } else {
            
                this.logger.pushGroup(k);
                return this._visit(node[k]).then(val => this.logger.popGroup());
            }
            
        }), Promise.when(null)).then(val => this);
    }
}
