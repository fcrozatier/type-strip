export const ERROR_MESSAGE = {
  // General
  "extension": "the script must be a TypeScript file",
  "filename": "the fileName must include the extension",
  // Unsupported features
  "accessor-keyword":
    "The `accessor` is a TypeScript-only feature with special semantics and is not part of the TC39 type annotation proposal. An alternative is to use explicit getters/setters",
  "declare":
    "Ambient Declarations are still up for discussion in the TC39 type annotation proposal. At the moment the proposal doesn't reserve space for ambient declarations",
  "enum":
    "Enums have runtime semantics and are not supported by the TC39 type annotation proposal. An alternative pattern is to use a const object",
  "jsx":
    "JSX is not intended to be implemented by browsers, but to be used by preprocessors. It's not part of the TC39 proposal.",
  "overload":
    "Function overloads are still up for discussion in the TC39 type annotation proposal. At the moment the proposal doesn't reserve space for function overloads.",
  "namespace":
    "Namespaces are a legacy TypeScript specific construct to provide modularity and an encapsulation. They are not supported by the TC39 type annotation proposal. Standard ES modules are the preferred way to address these needs",
  "parameter-property":
    "Parameter Properties are a convenience TypeScript syntax for turning a constructor parameter into a class property, but do not align with existing Javascript semantics. They are not supported by the TC39 type annotation proposal. The alternative is to use explicit field declarations and assignments",
  "type-assertion-expression":
    "Prefixed type assertions are discouraged and should be replaced by `as` assertions",
};

export class TypeStripError extends Error {
  constructor(code: keyof typeof ERROR_MESSAGE) {
    super(ERROR_MESSAGE[code]);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, TypeStripError);
  }
}
