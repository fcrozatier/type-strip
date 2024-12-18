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
