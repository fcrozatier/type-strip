# Type-Strip test suite

Each test suite has a `only` and `skip` parameters, to allow targeting or skipping specific test cases. The available test cases labels correspond to the `cases` subfolders of the suite.

To run the tests:

```sh
deno task test
```

To see the coverage:

```sh
deno task coverage
```

## Conventions

- Prefixes are separated with --
- For the "unsupported" cases the prefix corresponds to an error code

## Examples

```ts
const only = [/.*/]; // runs all tests

const only = [/variable-declarations/]; // only runs the "variable-declarations" test case

const skip = [/.*/]; // skips the whole suite
 ```