import { Promise, forEach as forEachPromise } from "Promise.js";
import { Test } from "Test.js";
import { Logger } from "Logger.js";

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
        this.logger.comment("Starting tests...");
        
        return this._visit(tests).then(val => {
        
            this.logger.comment(`Passed ${ this.logger.passed } tests and failed ${ this.logger.failed } tests.`);
            this.logger.end();
            return this;
        });
    }
    
    _exec(node, key) {
    
        var resolver, 
            promise = new Promise(r => resolver = r),
            test = new Test(this.logger);
        
        // Give the test a default name
        test.name(key);
        
        return Promise.resolve().then($=> {
        
            resolver.resolve(node[key](test, this.injections));    
            return promise;
        });
    }
    
    _visit(node) {
        
        return forEachPromise(Object.keys(node), k => {
        
            this.logger.pushGroup(k);
            
            return (typeof node[k] === "function" ?
                this._exec(node, k) :
                this._visit(node[k])
            ).then($=> this.logger.popGroup());
        });
    }
}
