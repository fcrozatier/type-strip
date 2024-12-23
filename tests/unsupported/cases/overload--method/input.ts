class Foo {
  bar(x: number): number;
  bar(x: string): string;
  bar(x: string | number): string | number {
    if (typeof x === "number") {
      return x + 1;
    } else {
      return x + "!";
    }
  }
}
