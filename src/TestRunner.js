import Promise from "Promise.js";
import Test from "Test.js";
import Logger from "Logger.js";

export class TestRunner {

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
    
        var promise = new Promise;
        
        var test = new Test({
        
            log: data => this.logger.log(data),
            done: val => promise.resolve(val)
        });
        
        // Give the test a default name
        test.name(key);
        
        return Promise.when(null).then(val => {
        
            node[key](test, this.injections);
            
            if (!test.async)
                promise.resolve(null);
            
            return promise.future;
        });
    }
    
    _visit(node) {
    
        return Promise.forEach(Object.keys(node), k => {
        
            if (typeof node[k] === "function") {
        
                return this._exec(node, k);
            
            } else {
            
                this.logger.pushGroup(k);
                return this._visit(node[k]).then(val => this.logger.popGroup());
            }
        });
    }
}
