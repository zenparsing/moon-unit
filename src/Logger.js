import { HtmlLogger } from "./HtmlLogger.js";
import { NodeLogger } from "./NodeLogger.js";

export let Logger = (typeof global === "object" && global.process) ?
    NodeLogger :
    HtmlLogger;
