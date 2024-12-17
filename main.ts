import tsBlankSpace from "ts-blank-space";

const path = "./input.ts";
console.log(`%cinput ts ${path}`, "color: magenta");
const code = await Deno.readTextFile(path);
const output = tsBlankSpace(code);
await Deno.writeTextFile("output.js", output);
