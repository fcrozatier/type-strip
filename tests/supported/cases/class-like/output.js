// Class Declaration
class Person {

  name;
  constructor(name) {
    this.name = name;
  }
  getGreeting() {
    return `Hello, my name is ${this.name}`;
  }
}

export const Mixin = (
  superclass,
) => {
  // Class Expression
  return class extends superclass { };
};

// Computed properties
const computed = () => "computed";

class Person {
  [computed()];

  get [computed()]() {
    return "get";
  }

  set [computed()](v) {
    console.log("set");
  }
}
