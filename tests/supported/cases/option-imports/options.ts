import type { TypeStripOptions } from "@fcrozatier/type-strip";

export const options: TypeStripOptions = {
  pathRewriting: true,
  remapSpecifiers: {
    filePath: "./lib/a.ts",
    imports: {
      "$foo/": "./foo/",
      "$fiz": "./fiz",
      "$baz": "@baz",
    },
  },
};
