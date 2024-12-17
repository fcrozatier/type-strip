import * as esbuild from "esbuild";
import tsBlankSpace from "ts-blank-space";
import ts from "typescript";

const path = "./fixtures.ts";
console.log(`%cinput ts ${path}`, "color: magenta");
const code = await Deno.readTextFile(path);

Deno.bench("ts.transpileModule", () => {
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

Deno.bench("tsBlankSpace", { baseline: true }, () => {
  tsBlankSpace(code);
});

Deno.bench("esbuild", async () => {
  await esbuild.transform(code, {
    loader: "ts",
    format: "esm",
    platform: "browser",
    target: "esnext",
    logLevel: "silent",
    sourcemap: false,
  });
});
