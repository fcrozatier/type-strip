// Optional and default parameters
function greet(name: string = "World", age?: number) {
  return `Hello, ${name}${age ? `, age ${age}` : ""}`;
}
// Rest parameters
function sumAll(...nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
