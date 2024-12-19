export const ERROR_MESSAGE = {
  // General
  "filename": "the fileName must include the extension",
  "extension": "the script must be a TypeScript file",
  // Unsupported features
  "enum":
    "Enums have runtime semantics and are not supported by the TC39 type annotation proposal. An alternative pattern is to use a const object",
  "namespace":
    "Namespaces are a legacy TypeScript specific construct to provide modularity and an encapsulation. They are not supported by the TC39 type annotation proposal. Standard ES modules are the preferred way to address these needs",
  "parameter-property":
    "Parameter Properties are a convenience TypeScript syntax for turning a constructor parameter into a class property, but do not align with existing Javascript semantics. They are not supported by the TC39 type annotation proposal. The alternative is to use explicit field declarations and assignments",
  "jsx":
    "JSX is not intended to be implemented by browsers, but to be used by preprocessors. It's not part of the TC39 proposal.",
};

export class TypeStripError extends Error {
  constructor(code: keyof typeof ERROR_MESSAGE) {
    super(ERROR_MESSAGE[code]);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, TypeStripError);
  }
}
