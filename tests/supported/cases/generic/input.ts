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
