import { HtmlLogger } from "./HtmlLogger.js";
import { NodeLogger } from "./NodeLogger.js";

export var Logger = (typeof global === "object" && global.process) ?
    NodeLogger :
    HtmlLogger;
