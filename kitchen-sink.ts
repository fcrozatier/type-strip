/***************************
 * TypeScript Kitchen Sink *
 ***************************/

// Basic Types
const num: number = 42;
let color: string = "blue";
let isDone: boolean = false;
const nullValue: null = null;
const undefinedValue: undefined = undefined;

// Arrays and Tuples
const numArray: number[] = [1, 2, 3];
const strArray: Array<string> = ["a", "b", "c"];
let tuple: [string, number] = ["hello", 42];
const mixedTuple: [number, string, boolean] = [42, "tuple", true];
let unknownVar: unknown = "Could be anything";
let anyVar: any = 4;

// Destructuring
const { c: count = 0, p: price = computed() as number } = {};

// Functions
function add(x: number, y: number): number {
  return x + y;
}

const subtract = (x: number, y: number): number => x - y;

function computed(): any {
  const sum: number = 10;
  const result: number = sum ** 2;
  const message: string = `The result is ${result}`;
  console.log(message);
  return result;
}

// Optional and default parameters
function greet(name: string = "World", age?: number): string {
  return `My name is ${name}${age ? `, and I'm ${age}` : ""}`;
}

// Rest parameters
function sumAll(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// Interfaces
interface Person {
  name: string;
  age: number;
  email?: string;
  greet(): string;
}

const user: Person = {
  name: "Alice",
  age: 30,
  greet() {
    return `Hi, I'm ${this.name}.`;
  },
};

// Type Aliases
type Point = {
  x: number;
  y: number;
};

type Shape = "Circle" | "Square" | "Triangle";

// Union and Intersection types
type UserID = string | number;
type Admin = Person & { permissions: string[] };

const admin: Admin = {
  name: "Bob",
  age: 40,
  permissions: ["create", "delete"],
  greet() {
    return `Admin ${this.name} at your service!`;
  },
};

// Literal Types
let specificValue: "hello" | "world" = "hello";

// Template Literal Types
type WelcomeMessage = `Hello, ${string}!`;
const msg: WelcomeMessage = "Hello, Alice!";

// Infer in Conditional Types
type UnpackPromise<T> = T extends Promise<infer U> ? U : never;
type Result = UnpackPromise<Promise<number>>; // number

// Type Assertions
let someValue: any = "this is a string";
let strLength: number = (someValue as string).length;

// Classes
class Animal {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  public speak(): string {
    return `${this.name} makes a noise.`;
  }

  protected move(): void {
    console.log(`${this.name} is moving.`);
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name);
  }

  public bark(): string {
    return `${this.speak()} Woof!`;
  }
}

const dog = new Dog("Rex");
console.log(dog.bark());

// Abstract Classes
abstract class ShapeBase {
  abstract getArea(): number;
}

class Circle extends ShapeBase {
  constructor(public radius: number) {
    super();
  }
  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

// Overrides
class UniCircle extends Circle {
  override radius = 1;

  constructor(radius: number) {
    super(1);
  }
  override getArea(): number {
    return Math.PI;
  }
}

const circle = new Circle(5);
console.log("Circle Area:", circle.getArea());

// Heritage
interface Printable {
  print(): void;
}

interface Savable {
  save(): void;
}

class Document implements Printable {
  print() {
    console.log("Printing document...");
  }
}

// Implementing multiple interfaces
class File implements Printable, Savable {
  print() {
    console.log("Printing file...");
  }

  save() {
    console.log("Saving file...");
  }
}

interface Movable {
  move(): void;
}

class Vehicle {
  startEngine() {
    console.log("Engine started.");
  }
}

// Implementing and extending
class Car extends Vehicle implements Movable {
  move() {
    console.log("Car is moving...");
  }
}

// Generics

// Generic function
const maybeNumbers = [undefined, 0];
const identity = <T>(x: T): T => x;
const self = identity<number>(maybeNumbers[1]!);

// Generic class
class Box<T> {
  content: T;
  constructor(content: T) {
    this.content = content;
  }
}

const stringBox = new Box<string>("Hello, Box!");
const numberBox = new Box<number>(123);

// Generic constraints
function logLength<T extends { length: number }>(arg: T): void {
  console.log(arg.length);
}

logLength([1, 2, 3]);
logLength("Hello");

// Utility Types

// Partial
type PartialPerson = Partial<Person>;

// Readonly
const readonlyPerson: Readonly<Person> = {
  name: "Readonly",
  age: 50,
  greet() {
    return "Can't modify me!";
  },
};

// Record
type RoleRecord = Record<string, string>;
const roles: RoleRecord = {
  admin: "Admin",
  editor: "Editor",
};

// Conditional Types
type IsString<T> = T extends string ? "Yes" : "No";
type Test1 = IsString<string>; // "Yes"
type Test2 = IsString<number>; // "No"

// Mapped Types
type ReadonlyPoint = { readonly [K in keyof Point]: Point[K] };

const immutablePoint: ReadonlyPoint = { x: 10, y: 20 };

// Keyof and Lookup Types
type PersonKeys = keyof Person; // "name" | "age" | "greet"
type AgeType = Person["age"]; // number

// Type Guards
function isString(value: any): value is string {
  return typeof value === "string";
}

const unknownValue: unknown = "hello";
if (isString(unknownValue)) {
  console.log(unknownValue.toUpperCase());
}

// Modules

// Export/Import (requires module system setup)
export const exportedValue = 123;

// Export Declaration
export type { PersonKeys };
// Named Export with type Specifier
export { type Person };
// Mixed
export { type PartialPerson, roles };

// Error Handling
try {
  throw new Error("Something went wrong!");
} catch (error: unknown) {
  console.error(error);
}
