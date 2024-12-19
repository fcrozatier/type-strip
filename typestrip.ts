import ts from "typescript";
import { TypeStripError } from "./errors.ts";

type TypeStripOptions = {
  removeComments?: boolean;
  fileName?: string;
};

const defaultOptions: Required<TypeStripOptions> = {
  removeComments: false,
  fileName: "input.ts",
};

let sourceFile: ts.SourceFile;
let printer: ts.Printer;
// printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)
let context: ts.TransformationContext;

/**
 * Takes a TypeScript input source file and outputs JavaScript with types stripped
 *
 * Throws if the code is not forward compatible with the TC39 type annotations proposal
 */
export default (
  input: string,
  options?: TypeStripOptions,
) => {
  const optionsWitDefaults = { ...defaultOptions, ...options };
  const fileNameSegments = optionsWitDefaults.fileName.split(".");

  if (fileNameSegments?.length < 2) {
    throw new TypeStripError("filename");
  }
  const extension = fileNameSegments[fileNameSegments.length - 1];
  if (extension === "jsx" || extension === "tsx") {
    throw new TypeStripError("jsx");
  }
  if (extension !== "ts") {
    throw new TypeStripError("extension");
  }
  sourceFile = ts.createSourceFile(
    optionsWitDefaults.fileName,
    input,
    ts.ScriptTarget.Latest,
    false, // setParentNodes
    ts.ScriptKind.TS,
  );

  return stripTypes(sourceFile, optionsWitDefaults);
};

const stripTypes = (
  sourceFile: ts.SourceFile,
  { removeComments }: TypeStripOptions,
) => {
  printer = ts.createPrinter({
    omitTrailingSemicolon: false,
    removeComments,
  });

  // @ts-ignore Actually a transformer can return undefined
  const result = ts.transform(sourceFile, [transformer]);
  const transformed = result.transformed[0];

  const output = printer.printFile(transformed as ts.SourceFile);
  result.dispose();
  return output;
};

const transformer =
  <T extends ts.Node>(transformationContext: ts.TransformationContext) =>
  (rootNode: T) => {
    context = transformationContext;

    return ts.visitNode(rootNode, visitor);
  };

const visitor = (node: ts.Node) => {
  switch (node.kind) {
    case ts.SyntaxKind.ExportDeclaration:
      return visitExportDeclaration(node as ts.ExportDeclaration);
    case ts.SyntaxKind.ImportDeclaration:
      return visitImportDeclaration(node as ts.ImportDeclaration);

    // Remove type annotations
    case ts.SyntaxKind.VariableDeclaration:
      return visitVariableDeclaration(node as ts.VariableDeclaration);

    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
      return undefined;

    case ts.SyntaxKind.SatisfiesExpression:
    case ts.SyntaxKind.AsExpression:
      return visitAsExpression(node as ts.AsExpression);

    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.ParenthesizedExpression:
      return visitExpressionLike(node as ts.NonNullExpression);

    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
      return visitFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration);

    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression:
      return visitClassLike(node as ts.ClassLikeDeclaration);

    case ts.SyntaxKind.PropertyDeclaration:
      return visitPropertyDeclaration(node as ts.PropertyDeclaration);

    case ts.SyntaxKind.NewExpression:
      return visitNewExpression(node as ts.NewExpression);

    // Unsupported syntax
    case ts.SyntaxKind.EnumDeclaration:
      throw new TypeStripError("enum");
    case ts.SyntaxKind.ModuleDeclaration:
      throw new TypeStripError("namespace");
    case ts.SyntaxKind.JsxElement:
      throw new TypeStripError("jsx");
  }

  return ts.visitEachChild(node, visitor, context);
};

/**
 * Handle export declaration
 *
 * @example
 * export type { SomeLocalType };
 * export { type SomeLocalType };
 * export { thing, type SomeLocalType };
 */
const visitExportDeclaration = (
  node: ts.ExportDeclaration,
): ts.ExportDeclaration | undefined => {
  if (node.isTypeOnly) {
    return undefined;
  }
  let exportClause = node.exportClause;

  if (exportClause && ts.isNamedExports(exportClause)) {
    exportClause = visitNamedExports(exportClause);
  }

  if (!exportClause) return undefined;

  return ts.factory.updateExportDeclaration(
    node,
    node.modifiers,
    false, // isTypeOnly
    exportClause,
    node.moduleSpecifier,
    node.attributes,
  );
};

const visitNamedExports = (node: ts.NamedExports) => {
  const elements = node.elements.map(visitExportSpecifier).filter(
    isNotUndefined,
  );

  if (elements.length === 0) return undefined;

  return ts.factory.updateNamedExports(node, elements as ts.ExportSpecifier[]);
};

const visitExportSpecifier = (node: ts.ExportSpecifier) => {
  if (node.isTypeOnly) return undefined;

  return node;
};

/**
 * Handle import declaration
 *
 * @example
 * import type { Person } from "module";
 */
const visitImportDeclaration = (
  node: ts.ImportDeclaration,
): ts.ImportDeclaration | undefined => {
  const importClause = visitImportClause(node.importClause);

  if (!importClause) return undefined;

  return ts.factory.updateImportDeclaration(
    node,
    node.modifiers,
    importClause,
    node.moduleSpecifier,
    node.attributes,
  );
};

const visitImportClause = (node: ts.ImportClause | undefined) => {
  if (node?.isTypeOnly) return undefined;

  let namedBindings = node?.namedBindings;

  if (namedBindings && ts.isNamedImports(namedBindings)) {
    namedBindings = visitNamedImports(namedBindings);
  }

  if (!namedBindings) return undefined;

  return ts.factory.updateImportClause(
    node as ts.ImportClause,
    false,
    node?.name,
    namedBindings,
  );
};

const visitNamedImports = (node: ts.NamedImports) => {
  const elements = node.elements.map(visitImportSpecifier).filter(
    isNotUndefined,
  );

  if (elements.length === 0) return undefined;

  return ts.factory.updateNamedImports(node, elements as ts.ImportSpecifier[]);
};

const visitImportSpecifier = (node: ts.ImportSpecifier) => {
  if (node.isTypeOnly) return undefined;

  return node;
};

/**
 * Handle variable declaration type annotation
 * @example
 * let x: string = "foo";
 */
const visitVariableDeclaration = (node: ts.VariableDeclaration): ts.Node => {
  const initializer = node.initializer ? visitor(node.initializer) : undefined;

  return ts.factory.updateVariableDeclaration(
    node,
    node.name,
    node.exclamationToken,
    undefined, // remove the type
    initializer as ts.Expression,
  );
};

/**
 * Handle type assertion
 *
 * @example
 * const value = 1 as number;
 */
const visitAsExpression = (node: ts.AsExpression | ts.SatisfiesExpression) => {
  return node.expression;
};

/**
 * Handles non null assertions
 *
 * @example document.getElementById("entry")!.innerText = "...";
 */
const visitExpressionLike = (
  node: ts.NonNullExpression | ts.ParenthesizedExpression,
): ts.NonNullExpression | ts.ParenthesizedExpression => {
  switch (node.kind) {
    case ts.SyntaxKind.ParenthesizedExpression:
      return ts.factory.updateParenthesizedExpression(
        node,
        visitor(node.expression) as ts.Expression,
      );
    case ts.SyntaxKind.NonNullExpression:
      return ts.factory.updateNonNullExpression(
        node,
        visitor(node.expression) as ts.Expression,
      );
  }
};

/**
 * Handle function parameter type annotation
 * @example
 * function equals(x: number, y?: number) {
      return x === y;
    }
 */
const visitParameter = (
  node: ts.ParameterDeclaration,
): ts.ParameterDeclaration | undefined => {
  if (
    node.modifiers &&
    hasModifier(node.modifiers, [
      ts.SyntaxKind.PublicKeyword,
      ts.SyntaxKind.PrivateKeyword,
      ts.SyntaxKind.ProtectedKeyword,
      ts.SyntaxKind.ReadonlyKeyword,
    ])
  ) {
    throw new TypeStripError("parameter-property");
  }

  if (ts.isIdentifier(node.name) && node.name.escapedText === "this") {
    return undefined;
  }

  if (node.type) {
    return ts.factory.updateParameterDeclaration(
      node,
      node.modifiers,
      node.dotDotDotToken,
      node.name,
      undefined, // remove the question token
      undefined, // remove the type
      node.initializer,
    );
  }
  return node;
};

/**
 * Handle function declaration return type annotation and type parameters
 * @example
 * function add<T>(x: T, y: T): T {
      return x + y;
    }
 */
const visitFunctionLikeDeclaration = (
  node: ts.FunctionLikeDeclaration,
): ts.FunctionLikeDeclaration => {
  const parameters = node.parameters.map(visitParameter).filter(isNotUndefined);

  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      return ts.factory.updateFunctionDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        undefined, // remove the type parameter
        parameters,
        undefined, // remove the return type
        node.body,
      );
    case ts.SyntaxKind.FunctionExpression:
      return ts.factory.updateFunctionExpression(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        undefined, // remove the type parameter
        parameters,
        undefined, // remove the return type
        node.body,
      );
    case ts.SyntaxKind.ArrowFunction:
      return ts.factory.updateArrowFunction(
        node,
        node.modifiers,
        undefined, // remove the type parameter
        parameters,
        undefined, // remove the return type
        node.equalsGreaterThanToken,
        node.body,
      );
    case ts.SyntaxKind.Constructor:
      return ts.factory.updateConstructorDeclaration(
        node,
        node.modifiers,
        parameters,
        node.body,
      );
    case ts.SyntaxKind.MethodDeclaration:
      return ts.factory.updateMethodDeclaration(
        node,
        node.modifiers,
        node.asteriskToken,
        node.name,
        undefined, // question token
        undefined, // type parameter
        parameters,
        undefined, // return type
        node.body,
      );
  }
  return node;
};

/**
 * Handle class like declarations and visits all members
 *
 * @example
 * class Dog {};
 *
 * export class {};
 *
 * abstract class Thing {};
 */
const visitClassLike = (
  node: ts.ClassLikeDeclaration,
): ts.ClassLikeDeclaration | undefined => {
  const members = node.members.map(visitor);

  if (node.modifiers) {
    if (hasModifier(node.modifiers, ts.SyntaxKind.AbstractKeyword)) {
      return undefined;
    }
  }

  switch (node.kind) {
    case ts.SyntaxKind.ClassDeclaration:
      return ts.factory.updateClassDeclaration(
        node,
        node.modifiers,
        node.name,
        undefined, // remove the type parameter
        node.heritageClauses,
        members as unknown as ts.NodeArray<ts.ClassElement>,
      );
    case ts.SyntaxKind.ClassExpression:
      return ts.factory.updateClassExpression(
        node,
        node.modifiers,
        node.name,
        undefined, // remove the type parameter
        node.heritageClauses,
        members as unknown as ts.NodeArray<ts.ClassElement>,
      );
  }
};

/**
 * Handle property declaration
 *
 * @example
 * class Person {
 *   name: string;
 * }
 */
const visitPropertyDeclaration = (
  node: ts.PropertyDeclaration,
): ts.PropertyDeclaration => {
  return ts.factory.updatePropertyDeclaration(
    node,
    node.modifiers,
    node.name,
    undefined, // remove the question or exclamation token
    undefined, // remove the type annotation
    node.initializer,
  );
};

/**
 * Handle new Expression
 *
 * @example
 * new Box<string>("hello")
 */
const visitNewExpression = (
  node: ts.NewExpression,
): ts.NewExpression => {
  return ts.factory.updateNewExpression(
    node,
    node.expression,
    undefined, // type argument
    node.arguments,
  );
};

/**
 * Checks whether one of the modifiers matches against any searched kind
 */
const hasModifier = (
  modifiers: ArrayLike<ts.ModifierLike>,
  kind: ts.SyntaxKind | ts.SyntaxKind[],
) => {
  const kindArray = Array.isArray(kind) ? kind : [kind];

  for (let i = 0; i < modifiers.length; i++) {
    if (kindArray.includes(modifiers[i].kind)) {
      return true;
    }
  }
  return false;
};

const isNotUndefined = <T>(x: T) => x !== undefined;
