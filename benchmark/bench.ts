import * as esbuild from "esbuild";
import tsBlankSpace from "ts-blank-space";
import ts from "typescript";
import typeStrip from "../index.ts";

/**
 * Generate a fixture with `Deno task gen:fixtures 2` for ~600 LOC
 *
 * Run the benchmark with `Deno task bench` or `Deno task bench -- full`
 *
 * By default the benchmark runs on the whole file. The "full" benchmark splits the file in sections of incremental sizes which are all tested
 *
 * Save the benchmark data with `Deno task bench --json > out.json`
 *
 */

const path = "benchmark/fixtures.ts";
console.log(`%cinput ${path}`, "color: magenta");
const text = await Deno.readTextFile(path);

const [kind] = Deno.args;

if (kind === "full") {
  // Split fixtures by comment sections and test increasing file lengths
  const sections = text.split(/\/\/.*/gm);
  sections.reduce((prev, curr) => {
    const code = prev + curr;
    run(code);
    return code;
  });
} else {
  run(text);
}

function run(code: string) {
  const lines = code.split(/\n/).length;

  Deno.bench(`ts.transpileModule`, { group: `${lines}` }, () => {
    ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        verbatimModuleSyntax: true,
        isolatedModules: true,
        removeComments: true,
      },
    });
  });

  Deno.bench(`tsBlankSpace`, { group: `${lines}` }, () => {
    tsBlankSpace(code);
  });

  Deno.bench(
    `type-strip`,
    { baseline: true, group: `${lines}` },
    () => {
      typeStrip(code);
    },
  );

  Deno.bench(`esbuild`, { group: `${lines}` }, async () => {
    await esbuild.transform(code, {
      loader: "ts",
      format: "esm",
      platform: "browser",
      target: "esnext",
      logLevel: "silent",
      sourcemap: false,
    });
  });
}
