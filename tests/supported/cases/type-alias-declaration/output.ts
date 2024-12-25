
const admin = {
  name: "Bob",
  age: 40,
  permissions: ["create", "delete"],
  greet() {
    return `Admin ${this.name} at your service!`;
  },
}