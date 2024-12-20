export const ERROR_MESSAGE = {
  // General
  "extension": "the script must be a TypeScript file",
  "filename": "the fileName must include the extension",
  // Unsupported features
  "accessor-keyword":
    "Auto-Accessors are not supported. Use explicit getters/setters. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#auto-accessors-in-classes",
  "declare":
    "Ambient Declarations are not supported. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#ambient-declarations",
  "decorator":
    "Decorators are not supported. Use a transpilation step or the mixin pattern. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#decorators",
  "enum":
    "Enums are not supported. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#enums",
  "jsx":
    "JSX is not supported. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#jsx",
  "namespace":
    "Namespaces are not supported. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#namespace",
  "overload":
    "Function overloads are not supported. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#overloads",
  "parameter-property":
    "Parameter Properties are not supported. Use explicit field declarations and assignments. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#parameter-properties",
  "type-assertion-expression":
    "Prefixed type assertions are not supported. Use `as`-expressions. https://github.com/fcrozatier/type-strip?tab=readme-ov-file#prefix-style-type-assertion",
};

export class TypeStripError extends Error {
  constructor(code: keyof typeof ERROR_MESSAGE) {
    super(ERROR_MESSAGE[code]);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, TypeStripError);
  }
}
