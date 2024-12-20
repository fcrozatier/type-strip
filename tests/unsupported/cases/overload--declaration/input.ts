function foo(x: number): number;
function foo(x: string): string;
function foo(x: string | number): string | number {
  if (typeof x === "number") {
    return x + 1;
  } else {
    return x + "!";
  }
}