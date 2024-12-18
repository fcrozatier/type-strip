// Optional and default parameters
function greet(name = "World", age) {
    return `Hello, ${name}${age ? `, age ${age}` : ""}`;
}
// Rest parameters
function sumAll(...nums) {
    return nums.reduce((a, b) => a + b, 0);
}
