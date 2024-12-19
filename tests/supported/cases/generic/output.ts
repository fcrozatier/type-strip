// Generic function
function identity(arg) {
  return arg;
}
// Generic class
class Box {
  content;
  constructor(content) {
    this.content = content;
  }
}
// New Expression
const stringBox = new Box("Hello, Box!");
const numberBox = new Box(123);
// Generic constraints
function logLength(arg) {
  console.log(arg.length);
}
logLength([1, 2, 3]);
logLength("Hello");
