import { TestRunner } from "TestRunner.js";
import { Logger } from "Logger.js";

export function runTests(tests) {

    return new TestRunner().run(tests);
}

export { TestRunner };