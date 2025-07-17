import { assertEquals } from "@std/assert";
import { walk } from "@std/fs";
import { basename, join } from "@std/path";
import TypeStrip, { type TypeStripOptions } from "../../index.ts";

const only = [/.*/];
const skip = undefined;

for await (
  const directory of walk(join(Deno.cwd(), "tests/supported/cases"), {
    includeDirs: true,
    includeFiles: false,
    followSymlinks: false,
    includeSymlinks: false,
    match: only,
    skip,
  })
) {
  const files = await Array.fromAsync(
    walk(directory.path, { exts: [".ts", ".js"], maxDepth: 1 }),
  );

  const inputEntry = files.find((file) => file.name === "input.ts");
  const outputEntry = files.find((file) => file.name === "output.js");
  const optionsEntry = files.find((file) => file.name === "options.ts");

  if (inputEntry && outputEntry) {
    const testCase = basename(directory.path);

    const inputCode = await Deno.readTextFile(inputEntry.path);
    const outputCode = await Deno.readTextFile(outputEntry.path);
    const options: Required<TypeStripOptions> = optionsEntry
      ? (await import(optionsEntry.path)).options
      : { removeComments: false, pathRewriting: false };

    const stripped = TypeStrip(inputCode, options);

    Deno.test(`handles ${testCase}`, () => {
      assertEquals(stripped, outputCode);
    });
  }
}
