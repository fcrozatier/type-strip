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
// Class Expression
export class {
  name: string;
  constructor(name: string) {
      this.name = name;
  }
  getGreeting(): string {
      return `Hello, my name is ${this.name}`;
  }
}
