<img src="/assets/type-strip.png" alt="" height="200" width="200">

<h1>Type-Strip</h1>

`Type-Strip` is a **super-fast** type-stripper: TypeScript code goes in, and JavaScript code with type annotations removed comes out.

It also ensures **forward compatibility** with the TC39 [Type Annotation Proposal](https://tc39.es/proposal-type-annotations/). This means that when the proposal reaches stage 4, you'll be able to seamlessly change your file extensions to `.js`, and won't need a transpilation step anymore.

If you're using modern TypeScript today, then `Type-Strip` might be the only build step you need.

## Features

- Strips type annotations
- Optionally strips comments and rewrites .ts imports. See the [options](#options) below
- Fast. See the [benchmark](#benchmark)
- Throws when an [unsupported syntax](#unsupported-features) is detected.

## Installation

Depending on your runtime / package-manager:

```sh
deno add jsr:@fcrozatier/type-strip
npx jsr add @fcrozatier/type-strip
pnpm dlx jsr add @fcrozatier/type-strip
yarn dlx jsr add @fcrozatier/type-strip
```

## Usage

Strip a string of code, files etc.

```ts
import strip from '@fcrozatier/type-strip';

console.log(strip("let num: number = 0;", {/* options */}));
//-> let num = 0;
```

### Example

Input

```ts
import { capitalize } from './utils.ts';

/**
 * This class implements a Person
 */
class Person {
  // Index signature
  [key: string]: any;

  name: string;
  constructor(name: string) {
    this.name = capitalize(name);
  }
  greet(): string {
    return `Hello, my name is ${this.name}`;
  }
}
```

Output with the `removeComments` and `pathRewriting` options:

```ts
import { capitalize } from './utils.js';

class Person {
  name;
  constructor(name) {
    this.name = capitalize(name);
  }
  greet() {
    return `Hello, my name is ${this.name}`;
  }
}
```

### Options

<dl>
  <dt><code>removeComments?: boolean</code></dt>
  <dd>Whether to strip comments</dd>
  <dd><em>Default</em> <code>false</code></dd>

  <dt><code>pathRewriting?: boolean</code></dt>
  <dd>Whether to rewrite <code>.ts</code> module imports to <code>.js</code> imports</dd>
  <dd><em>Default</em> <code>false</code></dd>
</dl>

## Unsupported features

The goal of the TC39 [proposal](https://tc39.es/proposal-type-annotations/) is to add type annotations without modifying the semantics of the language. This means that TypeScript-only features requiring a transpilation step are not supported.

### Auto-Accessors in Classes

[Auto-Accessors](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#auto-accessors-in-classes) are not yet natively supported in JavaScript and are part of the stage 3 <a href="https://github.com/tc39/proposal-decorators#class-auto-accessors">Decorator proposal</a>

```ts
class Person {
  accessor name: string;

  constructor(name: string) {
    this.name = name;
  }
}
```
An alternative is to use explicit getters/setters

```ts
class Person {
  #name: string;
  get name() {
    return this.#name;
  }
  set name(value: string) {
    this.#name = value;
  }
  constructor(name: string) {
    this.name = name;
  }
}
```

### Ambient Declarations

Ambient Declarations are still up for discussion in the TC39 type annotation proposal. At the moment the proposal doesn't reserve space for ambient declarations.

```ts
declare const foo: Bar
```
If you only need them for type-checking, the alternative is to expose them in a separate file.

### Decorators

[Decorators](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators) are not yet natively supported in JavaScript, and are part of the stage 3 [Decorator proposal](https://github.com/tc39/proposal-decorators)

```ts
@Logger("debug")
class Custom extends HTMLElement {
  //...
}
```
If you rely on them you can still have a transpilation step beforehand. Another alternative is to use the [mixin pattern](https://www.typescriptlang.org/docs/handbook/mixins.html)

```ts
export const Flying = <T extends new (...args: any[]) => any>(
  superclass: T,
) => {
  return class extends superclass {
    constructor(...options: any[]) {
      console.log("initializing...");
      super(...options);
    }
    fly() {
      console.log("flying!");
    }
  };
};

class Dog {}
class FlyingDog extends Flying(Dog) {}
const flyingDog = new FlyingDog(); //-> initializing...
flyingDog.fly(); //-> flying!
```
### Enums

[Enums](https://www.typescriptlang.org/docs/handbook/enums.html) are a TypeScript feature that requires transpilation and has runtime semantics. There is a recent stage 0 [proposal](https://github.com/rbuckton/proposal-enum) to include them in the language.

```ts
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}
```

An alternative is to use a `const` object

```ts
const Direction = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT",
} as const

type Direction = keyof typeof Direction;
```

### JSX

JSX is not intended to be implemented by browsers, but to be used by preprocessors. It's not part of the TC39 proposal.

### Namespaces

[Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html) are a legacy TypeScript-specific construct to provide modularity and encapsulation. They are not supported by the TC39 type annotation proposal. Standard ES modules are the preferred way to address these needs

### Overloads

[Function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads) are still up for discussion in the TC39 type annotation proposal. At the moment the proposal doesn't reserve space for function overloads.

```ts
/**
 * Returns an array of numbers between 0 and `stop` (excluded) in increments of 1
 */
export function range(stop: number): number[];
/**
 * Returns an array of numbers between `start` and `stop` (excluded) in increments of 1
 */
export function range(start: number, stop: number): number[];
/**
 * Returns an array of numbers between `start` and `stop` (excluded) in increments of `step`
 */
export function range(start: number, stop: number, step: number): number[];
export function range(startOrStop: number, stop?: number, step?: number) {
  let start = startOrStop;
  if (stop !== undefined && step !== undefined) {
    return Array.from(
      { length: (stop - start) / step },
      (_, i) => start + i * step,
    );
  } else if (stop !== undefined) {
    return Array.from({ length: stop - start }, (_, i) => start + i);
  } else {
    const stop = startOrStop;
    start = 0;
    return Array.from({ length: stop - start }, (_, i) => start + i);
  }
}
```

An alternative is to branch depending on the number of arguments or their type

```ts
type RangeOptions =
  | [stop: number]
  | [start: number, stop: number]
  | [start: number, stop: number, step: number];

/**
 * Makes an array of numbers between `start` (defaults to 0) and `stop` (excluded) in increments of `step` (defaults to 1)
 */
export function range(...args: RangeOptions) {
  switch (args.length) {
    case 1: {
      const [stop] = args;
      return Array.from({ length: stop }, (_, i) => i);
    }
    case 2: {
      const [start, stop] = args;
      return Array.from({ length: stop - start }, (_, i) => start + i);
    }
    case 3: {
      const [start, stop, step] = args;
      return Array.from(
        { length: (stop - start) / step },
        (_, i) => start + i * step,
      );
    }
  }
}
```

### Parameter Properties

[Parameter Properties](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties) are a convenience TypeScript syntax for turning a constructor parameter into a class property, but do not align with existing Javascript semantics. They are not supported by the TC39 type annotation proposal.

```ts
class Params {
  constructor(
    public readonly x: number,
    protected y: number,
    private z: number
  ) {
    // No body necessary
  }
}
```
The alternative is to use explicit field declarations and assignments
```ts
class Params {
  public readonly x: number;
  protected y: number;
  private z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
```

### Prefix-style type assertion

This is a legacy TypeScript syntax, the preferred way to assert a type is to use an `as`-expression

```ts
const something: unknown = "this is a string";
const legacy = (<string>something).length; // legacy prefix-style
const modern = (something as string).length; // as-expression
```

### Importing types without the `type` keyword

You need to import types explicitly to avoid runtime errors. To enforce this make sure your `tsconfig.json` contains the `"verbatimModuleSyntax": true` rule.

### Automatic semi-column insertion

The JavaScript syntax doesn't enforce the use of semi-columns, which can result in ambiguous or altogether buggy programs when stripping types. It's recommended to enforce the semi-columns rule in your formatter.

```ts
age // Without a semi-column this will become `age(1);` after type stripping
type Foo = string;
(1);
```

If you want to rely on automatic semi-column insertion at "transpilation time", then [tsBlankSpace](https://github.com/bloomberg/ts-blank-space/) is a very good alternative. Note that it has a different focus than `Type-Strip` as it supports JSX, and inserts blank spaces instead of just stripping the types, which can result in bigger file sizes.

## Benchmark


`Type-Strip` is super-fast: for short files of about 1000 lines of code it's 20% faster than esbuild.

![The relative performance of Type-Strip on files of 998 lines](/assets/benchmark-relative.png)

Check out the interactive [plot](/benchmark/index.html)

![Benchmark of Type-Strip vs esbuild on small files](/assets/benchmark-absolute.png)