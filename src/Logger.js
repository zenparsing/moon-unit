import { HtmlLogger } from "./HtmlLogger.js";
import { NodeLogger } from "./NodeLogger.js";

export var Logger = (typeof this.process === "object" && process.cwd) ?
    NodeLogger :
    HtmlLogger;
