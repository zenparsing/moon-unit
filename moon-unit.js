let runTimer = 0;

function scheduleRun() {
  if (runTimer) {
    clearTimeout(runTimer);
  }
  runTimer = setTimeout(() => {
    runTimer = 0;
    runTests().catch((err) => {
      queueMicrotask(() => { throw err; });
    });
  }, 0);
}

function createNode(name, test = null) {
  return {
    name,
    nodes: [],
    before: [],
    beforeEach: [],
    after: [],
    afterEach: [],
    only: false,
    test,
  };
}

function createTreeBuilder() {
  let stack = [createNode('#root')];
  let current = () => stack[stack.length - 1];
  return {
    root: stack[0],
    current,
    push: (name) => {
      let child = createNode(name);
      current().nodes.push(child);
      stack.push(child);
    },
    add: (name, test) => {
      current().nodes.push(createNode(name, test));
    },
    pop: () => {
      stack.pop();
    },
  };
}

let treeBuilder = createTreeBuilder();

export function describe(name, fn) {
  treeBuilder.push(name);
  fn();
  treeBuilder.pop();
}

export function it(name, fn) {
  treeBuilder.add(name, fn);
  scheduleRun();
}

export function before(fn) {
  treeBuilder.current().before.push(fn);
}

export function beforeEach(fn) {
  treeBuilder.current().beforeEach.push(fn);
}

export function after(fn) {
  treeBuilder.current().after.push(fn);
}

export function afterEach(fn) {
  treeBuilder.current().afterEach.push(fn);
}

let style = {
  green(msg) { return `\x1B[32m${ msg }\x1B[39m`; },
  red(msg) { return `\x1B[31m${ msg }\x1B[39m`; },
  gray(msg) { return `\x1B[90m${ msg }\x1B[39m`; },
  bold(msg) { return `\x1B[1m${ msg }\x1B[22m`; },
};

let unicode = {
  check: '\u2714',
  x: '\u2717',
};

class ConsoleLogger {
  constructor() {
    this.path = [];
    this.tests = 0;
    this.errors = [];
  }

  onGroupBegin(name) {
    this._print(this.path.length === 0 ? '' : name);
    this.path.push(name);
  }

  onGroupEnd() {
    this.path.pop();
    if (this.path.length === 1) {
      this._print();
    }
  }

  onSuccess(name) {
    this.tests += 1;
    this._print(style.green(unicode.check) + ' ' + style.gray(name));
  }

  onFailure(name, error) {
    this.tests += 1;
    this._print(style.red(unicode.x) + ' ' + style.gray(name));
    let path = this.path.slice(1).join('/');
    this.errors.push({ name, path, error });
  }

  onEnd() {
    let failed = this.errors.length;
    let passed = this.tests - failed;
    if (passed > 0) {
      this._print('  ' + style.green(passed + ' passed'));
      process.exitCode = 0;
    }
    if (failed > 0) {
      this._print('  ' + style.red(failed + ' failed'));
      this._print();
      this._printError(this.errors[0]);
      process.exitCode = 1;
    }
    this._print();
  }

  _print(msg) {
    let depth = this.path.length;
    console.log(msg ? ' '.repeat(depth * 2) + msg : '');
  }

  _printError({ name, path, error }) {
    let errorString = error.stack;
    errorString = errorString.replace(/(^|\n)/g, '\n  ');
    this._print(`  FAILED: "${ path ? path + ' - ' + name : name }"`);
    this._print(errorString);
  }
}

async function runTests(logger = new ConsoleLogger()) {
  let beforeEach = [];
  let afterEach = [];

  async function visit(node) {
    if (node.test) {
      for (let fn of beforeEach) {
        await fn();
      }

      try {
        await node.test();
        logger.onSuccess(node.name);
      } catch (error) {
        logger.onFailure(node.name, error);
      }

      for (let fn of afterEach) {
        await fn();
      }

      return;
    }

    let afterEachLength = afterEach.length;
    let beforeEachLength = beforeEach.length;

    for (let fn of node.beforeEach) {
      beforeEach.push(fn);
    }

    for (let fn of node.afterEach) {
      afterEach.push(fn);
    }

    for (let fn of node.before) {
      await fn();
    }

    logger.onGroupBegin(node.name);

    for (let child of node.nodes) {
      await visit(child);
    }

    logger.onGroupEnd();

    for (let fn of node.after) {
      await fn();
    }

    while (beforeEach.length > beforeEachLength) {
      beforeEach.pop();
    }

    while (afterEach.length > afterEachLength) {
      afterEach.pop();
    }
  }

  await visit(treeBuilder.root);

  logger.onEnd();
}
