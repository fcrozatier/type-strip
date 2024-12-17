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

## Results

1. As expected, Typescript is the slowest of the three, and esbuild the fastest
2. The difference in speed between `ts-blank-space` and `esbuild` is not significant, Bloomberg's library is only 1.xx times slower: the same order of magnitude