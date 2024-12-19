import { assertThrows } from "@std/assert";
import { walk } from "@std/fs";
import { basename, join } from "@std/path";
import { ERROR_MESSAGE, TypeStripError } from "../../errors.ts";
import strip from "../../typestrip.ts";

/**
 * Regex or string to filter the tests to run
 *
 * @example
 * const only = /.* /; // runs all tests
 * const only = /variable-declarations/; // only runs the "variable-declarations" test case
 */
const only = [/.*/];
const skip = undefined;

for await (
  const directory of walk(join(Deno.cwd(), "tests/unsupported/cases"), {
    includeDirs: true,
    includeFiles: false,
    followSymlinks: false,
    match: only,
    skip,
  })
) {
  const files = await Array.fromAsync(
    walk(directory.path, { exts: [".ts", ".tsx"], maxDepth: 1 }),
  );

  const inputEntry = files.find((file) =>
    file.name === "input.ts" || file.name === "input.tsx"
  );

  if (inputEntry) {
    const testCase = basename(directory.path);

    // convention: the test case prefix corresponds to the error code
    const errorCode = testCase.split("_")[0] as keyof typeof ERROR_MESSAGE;
    const errorMessage = ERROR_MESSAGE[errorCode];

    if (!errorMessage) throw new Error("no error message");

    const inputCode = await Deno.readTextFile(inputEntry.path);

    Deno.test(`handles ${testCase}`, () => {
      assertThrows(
        () => strip(inputCode, { fileName: inputEntry.name }),
        TypeStripError,
        errorMessage,
      );
    });
  }
}
