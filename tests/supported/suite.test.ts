import { assertEquals } from "@std/assert";
import { walk } from "@std/fs";
import { basename, join } from "@std/path";
import TypeStrip from "../../typestrip.ts";

for await (
  const directory of walk(join(Deno.cwd(), "tests/supported/cases"), {
    includeDirs: true,
    includeFiles: false,
    followSymlinks: false,
  })
) {
  const files = await Array.fromAsync(
    walk(directory.path, { exts: [".ts"], maxDepth: 1 }),
  );

  const inputEntry = files.find((file) => file.name === "input.ts");
  const outputEntry = files.find((file) => file.name === "output.ts");

  if (inputEntry && outputEntry) {
    const testCase = basename(directory.path);

    Deno.test(`handles ${testCase}`, async () => {
      const inputCode = await Deno.readTextFile(inputEntry.path);
      const outputCode = await Deno.readTextFile(outputEntry.path);

      const stripped = TypeStrip(inputCode);
      assertEquals(stripped, outputCode);
    });
  }
}
