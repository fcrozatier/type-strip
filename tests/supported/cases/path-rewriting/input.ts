import { a } from "./moduleA.ts";
import b from "./moduleB.ts";
export { c } from "./moduleC.ts";
export * from "./moduleD.ts";

// Dynamic import with a string literal is rewritten
import("./moduleE.ts");
// Dynamic import with an expression is not rewritten
import("./moduleF" + ".ts");
