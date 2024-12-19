// Accessibility modifiers
class Animal {
  name;
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a noise.`;
  }
  move() {
    console.log(`${this.name} is moving.`);
  }
}
