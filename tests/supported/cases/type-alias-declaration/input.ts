type Point = {
  x: number;
  y: number;
};
type Shape = "Circle" | "Square" | "Triangle";
type UserID = string | number;
type Admin = Person & { permissions: string[] };
const admin: Admin = {
  name: "Bob",
  age: 40,
  permissions: ["create", "delete"],
  greet() {
    return `Admin ${this.name} at your service!`;
  },
}
// Export modifier
export type SpecialBool = boolean;