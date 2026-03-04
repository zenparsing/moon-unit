type TestFunction = () => void | Promise<void>;

export function describe(name: string, fn: TestFunction): void;

export function it(name: string, fn: TestFunction): void;

export function before(fn: TestFunction): void;

export function beforeEach(fn: TestFunction): void;

export function after(fn: TestFunction): void;

export function afterEach(fn: TestFunction): void;
