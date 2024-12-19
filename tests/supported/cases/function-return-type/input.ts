// Function Declaration
function add(x: number, y: number): number {
  return x + y;
}

// Arrow Function
const subtract = (x: number, y: number): number => x - y;

// Type guard
function isString(value: any): value is string {
  return typeof value === "string";
}
