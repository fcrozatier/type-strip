class Person {

  name;
    constructor(name) {
        this.name = name;
  }

    getGreeting() {
        return `Hello, my name is ${this.name}`;
  }
}
export { Person, };
