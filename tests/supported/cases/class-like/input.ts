// Class Declaration
class Person {
  // Index signature
  [key: string]: any;

  name: string;
  constructor(name: string) {
    this.name = name;
  }
  getGreeting(): string {
    return `Hello, my name is ${this.name}`;
  }
}

export const Mixin = <
T extends Constructor<Thing>,
>(
  superclass: T,
) => {
  // Class Expression
  return class extends superclass implements Interface { };
};

// Computed properties
const computed = <T>():T => "computed";

class Person {
  [computed<string>()]: string;

  get [computed<string>()]() {
    return "get";
  }

  set [computed<string>()](v) {
    console.log("set");
  }
}
