// Class Declaration
class Person {
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
