var console = this.console || { log() {} },
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

export class HtmlLogger {

    constructor() {
    
        this.target = findTarget();
        this.clear();
    }
    
    clear() {
    
        this.depth = 0;
        this.html = "";
        
        if (this.target)
            this.target.innerHTML = "";
    }
    
    end() {
    
        this._flush();
    }
    
    pushGroup(name) {
    
        this.depth += 1;
        
        var line = "=".repeat(this.depth + 1);
        console.log(`\n${ line } ${ name } ${ line }`);
        
        this._writeHeader(name, this.depth);
    }
    
    popGroup() {
    
        this.depth -= 1;
        this._flush();
    }
    
    log(result) {
    
        console.log(`${ result.name }: [${ result.pass ? "OK" : "FAIL" }]`);
        
        this.html += 
        `<div class='${ result.pass ? "pass" : "fail" }'>
            ${ result.name } <span class="status">[${ result.pass ? "OK" : "FAIL" }]</span>
        </div>`;
    }
    
    error(err) {
    
    }
    
    _writeHeader(name) {
    
        var level = Math.min(Math.max(2, this.depth + 1), 6);
        this.html += `<h${ level }>${ name }</h${ level }>`;
    }
    
    _flush() {
    
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
}