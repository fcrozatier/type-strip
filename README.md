# Stripping types

This repo implements a benchmark comparing the speed of different library at stripping ts type annotations:
- raw Typescript's `transpileModule` API
- Bloomberg's `ts-blank-space` library
- `esbuild`

Here we're only looking for a simple transpilation focused on just removing type annotations.

To run the benchmark:
```sh
deno task bench
```
