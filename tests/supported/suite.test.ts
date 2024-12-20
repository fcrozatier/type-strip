import { assertEquals } from "@std/assert";
import { walk } from "@std/fs";
import { basename, join } from "@std/path";
import TypeStrip from "../../index.ts";

/**
 * Regex or string to filter the tests to run
 *
 * @example
 * const only = /.* /; // runs all tests
 * const only = /variable-declarations/; // only runs the "variable-declarations" test case
 *
 * Skip all
 * const only = undefined
 * const skip = [/.* /]
 */
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
    walk(directory.path, { exts: [".ts"], maxDepth: 1 }),
  );

  const inputEntry = files.find((file) => file.name === "input.ts");
  const outputEntry = files.find((file) => file.name === "output.ts");

  if (inputEntry && outputEntry) {
    const testCase = basename(directory.path);

    const inputCode = await Deno.readTextFile(inputEntry.path);
    const outputCode = await Deno.readTextFile(outputEntry.path);

    const stripped = TypeStrip(inputCode, { prettyPrint: true });

    Deno.test(`handles ${testCase}`, () => {
      assertEquals(stripped, outputCode);
    });
  }
}
