"use strict";

import Runner from "Runner.js";
import Logger from "Logger.js";

export function run(tests) {

    return new Runner().run(tests);
}

export Runner;