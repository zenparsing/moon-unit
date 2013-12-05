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
    
        var resolve, 
            promise = new Promise(r => resolve = r),
            test = new Test(this.logger);
        
        // Give the test a default name
        test.name(key);
        
        return Promise.resolve().then($=> {
        
            resolve(node[key](test, this.injections));    
            return promise;
        });
    }
    
    _visit(node) {
        
        var list = Object.keys(node), k;
        
        var next = $=> {
        
            if (list.length === 0)
                return;
            
            this.logger.pushGroup(k = list.shift());
            
            var p = typeof node[k] === "function" ?
                this._exec(node, k) :
                this._visit(node[k]);
            
            return p.then($=> this.logger.popGroup()).then(next);
        };
        
        return Promise.resolve(next());
    }
}
