var Style = {

    green(msg) { return `\x1B[32m${ msg }\x1B[39m` },
    red(msg) { return `\x1B[31m${ msg }\x1B[39m` },
    gray(msg) { return `\x1B[90m${ msg }\x1B[39m` },
    bold(msg) { return `\x1B[1m${ msg }\x1B[22m` }
}

export class NodeLogger {

    constructor() {
    
        this.clear();
    }
    
    clear() {
    
        this.depth = 0;
        this.passed = 0;
        this.failed = 0;
        this.margin = false;
    }
    
    get indent() {
    
        return " ".repeat(Math.max(this.depth, 0) * 2);
    }
    
    end() {
    
        // Empty
    }
    
    pushGroup(name) {
        
        this._newline();
        this._write(Style.bold(`${ this.indent }${ name }`));
        
        this.depth += 1;
    }
    
    popGroup() {
    
        this.depth -= 1;
    }
    
    log(result) {
    
        var passed = !!result.pass;
        
        if (passed) this.passed++;
        else this.failed++;
        
        this._write(`${ this.indent }${ result.name } ${ passed ? Style.green("OK") : Style.red("FAIL") }`);
    }
    
    comment(msg) {
    
        this._newline();
        this._write(this.indent + Style.gray(msg));
        this._newline();
    }
    
    _write(text) {
    
        console.log(text);
        this.margin = false;
    }
    
    _newline() {
    
        if (!this.margin)
            console.log("");
        
        this.margin = true;
    }
}