const num: number = 42;
const str: string = "Hello, TypeScript!";
const bool: boolean = true;
const nullValue: null = null;
const undefinedValue: undefined = undefined;
const numArray: number[] = [1, 2, 3];
const strArray: Array<string> = ["a", "b", "c"];
const mixedTuple: [number, string, boolean] = [42, "tuple", true];
try {
  throw new Error("Something went wrong!");
} catch (error: unknown) {
  console.error(error);
}
