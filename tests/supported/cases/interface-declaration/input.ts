interface Person {
  name: string;
  age: number;
  greet(): string;
}

const user: Person = {
  name: "Alice",
  age: 30,
  greet() {
    return `Hi, I'm ${this.name}.`;
  },
};

// Export modifier
export interface Person {
  name: string;
  age: number;
}
