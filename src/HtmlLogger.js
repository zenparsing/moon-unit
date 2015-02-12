var ELEMENT_ID = "unit-test-output";

function findTarget() {

    let e;

    for (let w = window; w; w = w.parent) {

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
        this.passed = 0;
        this.failed = 0;
        this.html = "";

        if (this.target)
            this.target.innerHTML = "";
    }

    end() {

        this._flush();
    }

    pushGroup(name) {

        this.depth += 1;

        this._writeHeader(name, this.depth);
    }

    popGroup() {

        this.depth -= 1;
        this._flush();
    }

    log(result) {

        let passed = !!result.pass;

        if (passed) this.passed++;
        else this.failed++;

        this.html +=
        `<div class='${ result.pass ? "pass" : "fail" }'>
            ${ result.name } <span class="status">[${ passed ? "OK" : "FAIL" }]</span>
        </div>`;
    }

    comment(msg) {

        this.html += `<p class="comment">${ msg }</p>`;
    }

    _writeHeader(name) {

        let level = Math.min(Math.max(2, this.depth + 1), 6);
        this.html += `<h${ level }>${ name }</h${ level }>`;
    }

    _flush() {

        if (!this.target)
            return;

        let document = this.target.ownerDocument,
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
