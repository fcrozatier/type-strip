namespace MyNamespace {
  export function log(message: string): void {
    console.log(`Namespace log: ${message}`);
  }
}

MyNamespace.log("Hello, Namespace!");