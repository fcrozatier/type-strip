import { a } from "./moduleA.js";
import b from "./moduleB.js";
export { c } from "./moduleC.js";
export * from "./moduleD.js";

// Dynamic import with a string literal is rewritten
import("./moduleE.js");
// Dynamic import with an expression is not rewritten
import("./moduleF" + ".ts");
