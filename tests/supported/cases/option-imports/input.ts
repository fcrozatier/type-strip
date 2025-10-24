import a from "$foo/bar.ts";
import type A from "$foo/bar.d.ts";
import { b } from "$fiz/bar.ts";
import { type B } from "$foo/bar.d.ts";
import { c, type C } from "$baz/bar";

export { b } from "$fiz/bar.ts";
export { type B } from "$foo/bar.d.ts";
export { c, type C } from "$baz/bar";