class User {
  name;

  constructor() {
    this.initialize();
  }

  initialize() {
    this.name = "Frédéric";
  }

  greet() {
    console.log(`Hello, ${this.name}!`);
  }
}
