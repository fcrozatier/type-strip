export const ERROR_MESSAGE = {
  // General
  "extension": "the script must be a TypeScript file",
  "filename": "the fileName must include the extension",
  // Unsupported features
  "accessor-keyword":
    "Auto-Accessors are not supported. Use explicit getters/setters",
  "declare": "Ambient Declarations are not supported",
  "decorator":
    "Decorators are not supported. Use a transpilation step or the mixin pattern",
  "enum": "Enums are not supported",
  "jsx": "JSX is not supported",
  "overload": "Function overloads are not supported",
  "namespace": "Namespaces are not supported",
  "parameter-property":
    "Parameter Properties are not supported. Use explicit field declarations and assignments",
  "type-assertion-expression":
    "Prefixed type assertions are not supported. Use `as`-expressions",
};

export class TypeStripError extends Error {
  constructor(code: keyof typeof ERROR_MESSAGE) {
    super(ERROR_MESSAGE[code]);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, TypeStripError);
  }
}
