// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic class
class Box<T> {
  content: T;
  constructor(content: T) {
    this.content = content;
  }
}

// New Expression
const stringBox = new Box<string>("Hello, Box!");
const numberBox = new Box<number>(123);

// Generic constraints
function logLength<T extends { length: number }>(arg: T): void {
  console.log(arg.length);
}

logLength([1, 2, 3]);
logLength("Hello");
logLength<string>("World");

// Whitespace preceding `>`
const spaceBox = new Box<boolean >(true);
const verySpaciousBox = new Box< boolean , string >(true);
logLength<string >("World");
