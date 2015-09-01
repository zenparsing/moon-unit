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

        this.passed = 0;
        this.failed = 0;
        this.failList = [];
        this.path = [];
        this.margin = false;
    }

    get indent() {

        return " ".repeat(Math.max(this.path.length, 0) * 2);
    }

    end() {

        this.failList.forEach(({ path, result }) => {

            this._write(Style.bold(path + " > " + result.name));
            this._write("  Actual: " + result.actual);
            this._write("  Expected: " + result.expected);
            this._newline();
        });
    }

    pushGroup(name) {

        this._newline();
        this._write(Style.bold(`${ this.indent }${ name }`));
        this.path.push(name);
    }

    popGroup() {

        this.path.pop();
    }

    log(result) {

        let passed = !!result.pass;

        if (passed) this.passed++;
        else this.failed++;

        if (!passed)
            this.failList.push({ path: this.path.join(" > "), result });

        this._write(`${ this.indent }${ result.name } ` +
            `${ Style.bold(passed ? Style.green("OK") : Style.red("FAIL")) }`);
    }

    error(e) {

        if (e)
            this._write("\n" + Style.red(e.stack) + "\n");
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
