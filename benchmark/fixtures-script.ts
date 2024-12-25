/**
 * Generates arbitrarily long self-contained ts files showcasing all the allowed syntaxes
 *
 * One iteration is about ~300 lines
 *
 * Usage:
 * ```sh
 * deno task gen:fixtures [iterations]
 * ```
 * where [iterations] is the number of iterations
 *
 * See `kitchen-sink.ts`
 */
function generateFixtures(outputFile: string, iterations = 1) {
  let content = "";

  for (let i = 0; i < iterations; i++) {
    content += `
// Basic Types
const num${i}: number = 42;
let color${i}: string = "blue";
let isDone${i}: boolean = false;
const nullValue${i}: null = null;
const undefinedValue${i}: undefined = undefined;

// Arrays and Tuples
const numArray${i}: number[] = [1, 2, 3];
const strArray${i}: Array<string> = ["a", "b", "c"];
let tuple${i}: [string, number] = ["hello", 42];
const mixedTuple${i}: [number, string, boolean] = [42, "tuple", true];
let unknownVar${i}: unknown = "Could be anything";
let anyVar${i}: any = 4;

// Functions
function add${i}(x: number, y: number): number {
  return x + y;
}

const subtract${i} = (x: number, y: number): number => x - y;

function computed${i}(): any {
  const sum: number = 10;
  const result: number = sum ** 2;
  return result;
}

// Optional and default parameters
function greet${i}(name: string = "World", age?: number): string {
  return "hi";
}

// Rest parameters
function sumAll${i}(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// Interfaces
interface Person${i} {
  name: string;
  age: number;
  email?: string;
  greet(): string;
}

const user${i}: Person${i} = {
  name: "Alice",
  age: 30,
  greet() {
    return "Hi"
  },
};

// Type Aliases
type Point${i} = {
  x: number;
  y: number;
};

type Shape${i} = "Circle" | "Square" | "Triangle";

// Union and Intersection types
type UserID${i} = string | number;
type Admin${i} = Person${i} & { permissions: string[] };

const admin${i}: Admin${i} = {
  name: "Bob",
  age: 40,
  permissions: ["create", "delete"],
  greet() {
    return "Admin";
  },
};

// Literal Types
let specificValue${i}: "hello" | "world" = "hello";

// Template Literal Types
type WelcomeMessage${i} = \`Hello, \${string}!\`;
const msg${i}: WelcomeMessage${i} = "Hello, Alice!";

// Infer in Conditional Types
type UnpackPromise${i}<T> = T extends Promise<infer U> ? U : never;
type Result${i} = UnpackPromise${i}<Promise<number>>; // number

// Type Assertions
let someValue${i}: any = "this is a string";
let strLength${i}: number = (someValue${i} as string).length;

// Classes
class Animal${i} {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public speak(): string {
    return "speak";
  }

  protected move(): void {
    console.log("move");
  }
}

class Dog${i} extends Animal${i} {
  constructor(name: string) {
    super(name);
  }

  public bark(): string {
    return 'woof';
  }
}

const dog${i} = new Dog${i}("Rex");
console.log(dog${i}.bark());

// Abstract Classes
abstract class ShapeBase${i} {
  abstract getArea(): number;
  }

class Circle${i} extends ShapeBase${i} {
    radius:number;
    constructor(radius: number) {
    super();
    this.radius = radius;
  }
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

// Overrides
class UniCircle${i} extends Circle${i} {
  override radius = 1;

  constructor(radius: number) {
    super(1);
  }
  override getArea(): number {
    return Math.PI;
  }
}

const circle${i} = new Circle${i}(5);
console.log("Circle Area:", circle${i}.getArea());

// Heritage
interface Printable${i} {
  print(): void;
}

interface Savable${i} {
  save(): void;
}

class Document${i} implements Printable${i} {
  print() {
    console.log("Printing document...");
  }
}

// Implementing multiple interfaces
class File${i} implements Printable${i}, Savable${i} {
  print() {
    console.log("Printing file...");
  }

  save() {
    console.log("Saving file...");
  }
}

interface Movable${i} {
  move(): void;
}

class Vehicle${i} {
  startEngine() {
    console.log("Engine started.");
  }
}

// Implementing and extending
class Car${i} extends Vehicle${i} implements Movable${i} {
  move() {
    console.log("Car is moving...");
  }
}

// Generic function
const maybeNumbers${i} = [undefined, 0];
const identity${i} = <T>(x: T): T => x;
const self${i} = identity${i}<number>(maybeNumbers${i}[1]!);

// Generic class
class Box${i}<T> {
  content: T;
  constructor(content: T) {
    this.content = content;
  }
}

const stringBox${i} = new Box${i}<string>("Hello, Box!");
const numberBox${i} = new Box${i}<number>(123);

// Generic constraints
function logLength${i}<T extends { length: number }>(arg: T): void {
  console.log(arg.length);
}

logLength${i}([1, 2, 3]);
logLength${i}("Hello");

// Utility Types

// Partial
type PartialPerson${i} = Partial<Person${i}>;

// Readonly
const readonlyPerson${i}: Readonly<Person${i}> = {
  name: "Readonly",
  age: 50,
  greet() {
    return "Can't modify me!";
  },
};

// Record
type RoleRecord${i} = Record<string, string>;
const roles${i}: RoleRecord${i} = {
  admin: "Admin",
  editor: "Editor",
};

// Conditional Types
type IsString${i}<T> = T extends string ? "Yes" : "No";
type Test1${i} = IsString${i}<string>; // "Yes"
type Test2${i} = IsString${i}<number>; // "No"

// Mapped Types
type ReadonlyPoint${i} = { readonly [K in keyof Point${i}]: Point${i}[K] };

const immutablePoint${i}: ReadonlyPoint${i} = { x: 10, y: 20 };

// Keyof and Lookup Types
type PersonKeys${i} = keyof Person${i}; // "name" | "age" | "greet"
type AgeType${i} = Person${i}["age"]; // number

// Type Guards
function isString${i}(value: any): value is string {
  return typeof value === "string";
}

const unknownValue${i}: unknown = "hello";
if (isString${i}(unknownValue${i})) {
  console.log(unknownValue${i}.toUpperCase());
}

// Modules

// Export/Import (requires module system setup)
export const exportedValue${i} = 123;

// Export Declaration
export type { PersonKeys${i} };
// Named Export with type Specifier
export { type Person${i} };
// Mixed
export { type PartialPerson${i}, roles${i} };

// Error Handling
try {
  throw new Error("Something went wrong!");
} catch (error: unknown) {
  console.error(error);
}
`;
  }

  Deno.writeTextFileSync(outputFile, content);
  console.log(`Generated ${outputFile} with ${iterations} iterations.`);
}

const iterations = parseInt(Deno.args[0]) ?? 100;
generateFixtures("benchmark/fixtures.ts", iterations);
