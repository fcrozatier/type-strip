function compute(x: number, y: number): number {
  const sum: number = x + y;
  const result: number = sum ** 2;
  const message: string = `The result is ${result}`;
  console.log(message);
  return result;
}
