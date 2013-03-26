export class NodeLogger {

    constructor() {
    
        this.clear();
    }
    
    clear() {
    
        this.depth = 0;
    }
    
    end() {
    
        // Empty
    }
    
    pushGroup(name) {
    
        this.depth += 1;
        var line = "=".repeat(this.depth + 1);
        console.log(`\n${ line } ${ name } ${ line }`);
    }
    
    popGroup() {
    
        this.depth -= 1;
    }
    
    log(result) {
    
        console.log(`${ result.name }: [${ result.pass ? "OK" : "FAIL" }]`);
    }
    
    error(err) {
    
    }
}