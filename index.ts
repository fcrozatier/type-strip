import ts from "typescript";
import { TypeStripError } from "./errors.ts";

type TypeStripOptions = {
  /**
   * Whether to strip comments
   */
  removeComments?: boolean;
  /**
   * The file name used internally. Only .ts files are accepted
   */
  fileName?: string;
};

type StripItem = { start: number; end: number; trailing?: RegExp };

const defaultOptions: Required<TypeStripOptions> = {
  removeComments: false,
  fileName: "input.ts",
};

let sourceFile: ts.SourceFile;
let sourceCode: string;
let outputCode: string;

const skip = new Set<ts.Node>();
let strip: StripItem[] = [];

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

  sourceFile = ts.createSourceFile(
    optionsWitDefaults.fileName,
    input,
    ts.ScriptTarget.Latest,
    false, // setParentNodes
    ts.ScriptKind.TS,
  );

  sourceCode = sourceFile.getFullText();
  outputCode = "";

  try {
    walk(sourceFile, visitor);

    let index = 0;
    const sortedEdits = strip.toSorted((a, b) => a.start - b.start);

    for (const { start, end, trailing } of sortedEdits) {
      if (start !== undefined && end !== undefined) {
        if (index < start) {
          outputCode += sourceCode.slice(index, start);
          index = end;
        }
        if (index < end) {
          index = end;
        }
      }
      if (trailing) {
        const match = sourceCode.slice(index).match(trailing);
        if (match) {
          index += match[0].length;
        }
      }
    }
    if (index < sourceCode.length) {
      outputCode += sourceCode.slice(index);
    }

    return outputCode;
  } finally {
    strip = [];
    skip.clear();
  }
};

const walk = (node: ts.Node, visit: (node: ts.Node) => void): void => {
  if (!skip.has(node)) {
    visit(node);
  }

  // the skip-list can change as a side-effect of visit
  if (!skip.has(node)) {
    node.forEachChild((child) => walk(child, visit));
  }
};

const visitor = (node: ts.Node | undefined) => {
  switch (node?.kind) {
    case ts.SyntaxKind.ExportDeclaration:
      return visitExportDeclaration(node as ts.ExportDeclaration);
    case ts.SyntaxKind.ImportDeclaration:
      return visitImportDeclaration(node as ts.ImportDeclaration);

    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.IndexSignature:
      strip.push({ start: node.pos, end: node.end });
      skip.add(node);
      break;

    case ts.SyntaxKind.VariableStatement:
      return visitVariableStatement(node as ts.VariableStatement);
    case ts.SyntaxKind.VariableDeclaration:
      return visitVariableDeclaration(node as ts.VariableDeclaration);

    case ts.SyntaxKind.ExpressionWithTypeArguments:
      return visitExpressionWithTypeArguments(
        node as ts.ExpressionWithTypeArguments,
      );
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.AsExpression:
    case ts.SyntaxKind.SatisfiesExpression:
      strip.push({
        start: (node as ts.AsExpression).expression.end,
        end: node.end,
      });
      break;
    case ts.SyntaxKind.CallExpression:
      return visitCallExpression(node as ts.CallExpression);
    case ts.SyntaxKind.NewExpression:
      return visitNewExpression(node as ts.NewExpression);
    case ts.SyntaxKind.TaggedTemplateExpression:
      return visitTaggedTemplateExpression(node as ts.TaggedTemplateExpression);

    case ts.SyntaxKind.Parameter:
      return visitParameter(node as ts.ParameterDeclaration);

    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
      return visitFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration);

    case ts.SyntaxKind.PropertyDeclaration:
      return visitPropertyDeclaration(node as ts.PropertyDeclaration);

    case ts.SyntaxKind.HeritageClause:
      return visitHeritageClause(node as ts.HeritageClause);

    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.ClassExpression:
      return visitClassLike(node as ts.ClassLikeDeclaration);

    // Unsupported syntax
    case ts.SyntaxKind.EnumDeclaration:
      throw new TypeStripError("enum");
    case ts.SyntaxKind.ModuleDeclaration:
      throw new TypeStripError("namespace");
    case ts.SyntaxKind.TypeAssertionExpression:
      throw new TypeStripError("type-assertion-expression");
  }
};

/**
 * Handle export declaration
 *
 * @example
 * export type { SomeLocalType };
 * export { type SomeLocalType };
 * export { thing, type SomeLocalType };
 */
const visitExportDeclaration = (node: ts.ExportDeclaration) => {
  if (node.isTypeOnly) {
    strip.push({ start: node.pos, end: node.end });
    skip.add(node);
  } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    const exportsToSkip = node.exportClause.elements.map(visitExportSpecifier)
      .filter(isNotUndefined);
    if (exportsToSkip?.length === node.exportClause.elements.length) {
      // skip the whole import declaration
      strip.push({ start: node.pos, end: node.end });
      skip.add(node);
    } else {
      for (const skipExport of exportsToSkip) {
        strip.push(skipExport);
        skip.add(node);
      }
    }
  }
};

const visitExportSpecifier = (
  node: ts.ExportSpecifier,
): StripItem | undefined => {
  if (node.isTypeOnly) {
    return { start: node.pos, end: node.end, trailing: /,/ };
  }
};

const visitImportDeclaration = (node: ts.ImportDeclaration) => {
  if (node.importClause?.isTypeOnly) {
    strip.push({ start: node.pos, end: node.end });
    skip.add(node);
  } else if (node.importClause) {
    const skipDeclaration = visitImportClause(node.importClause);
    if (skipDeclaration) {
      strip.push({ start: node.pos, end: node.end });
      skip.add(node);
    }
  }
};

const visitImportClause = (node: ts.ImportClause) => {
  if (node?.namedBindings && ts.isNamedImports(node.namedBindings)) {
    const importsToSkip = node.namedBindings.elements.map(visitImportSpecifier)
      .filter(isNotUndefined);
    if (importsToSkip?.length === node.namedBindings?.elements.length) {
      return true; // skip the whole import declaration
    } else {
      for (const skipImport of importsToSkip) {
        strip.push(skipImport);
        skip.add(node);
      }
    }
  }
};

const visitImportSpecifier = (
  node: ts.ImportSpecifier,
): StripItem | undefined => {
  if (node.isTypeOnly) {
    return { start: node.pos, end: node.end, trailing: /,/ };
  }
};

const visitVariableStatement = (node: ts.VariableStatement) => {
  if (
    node.modifiers && hasModifier(node.modifiers, ts.SyntaxKind.DeclareKeyword)
  ) {
    throw new TypeStripError("declare");
  }
};

/**
 * Handle variable declaration type annotation
 * @example
 * let x: string = "foo";
 */
const visitVariableDeclaration = (node: ts.VariableDeclaration) => {
  if (node.exclamationToken) {
    strip.push({
      start: node.exclamationToken.pos,
      end: node.exclamationToken.end,
    });
  }

  if (node.type) {
    strip.push({
      start: node.type.pos - 1,
      end: node.type.end,
    });
    skip.add(node.type);
  }
};

const visitExpressionWithTypeArguments = (
  node: ts.ExpressionWithTypeArguments,
) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1 ,
    });
    node.typeArguments.forEach((t) => skip.add(t));
  }
};

const visitTaggedTemplateExpression = (node: ts.TaggedTemplateExpression) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
    node.typeArguments.forEach((t) => skip.add(t));
  }
};

/**
 * Handle function parameter type annotation
 * @example
 * function equals(x: number, y?: number) {
      return x === y;
    }
 */
const visitParameter = (node: ts.ParameterDeclaration) => {
  if (
    node.modifiers &&
    hasModifier(node.modifiers, [
      ts.SyntaxKind.PublicKeyword,
      ts.SyntaxKind.PrivateKeyword,
      ts.SyntaxKind.ProtectedKeyword,
      ts.SyntaxKind.ReadonlyKeyword,
      ts.SyntaxKind.OverrideKeyword,
    ])
  ) {
    throw new TypeStripError("parameter-property");
  }

  if (ts.isIdentifier(node.name) && node.name.escapedText === "this") {
    strip.push({ start: node.pos, end: node.end, trailing: /,\s*/ });
    skip.add(node.name);
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
    skip.add(node.type);
  }
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
) => {
  // Check if it has a declare modifier first
  if (node.modifiers) {
    visitModifiers(node.modifiers);
    if(ts.isMethodDeclaration(node) && hasModifier(node.modifiers, ts.SyntaxKind.AbstractKeyword)){
      strip.push({
        start: node.pos,
        end: node.end
      })
      skip.add(node)
    }
  }
  if (
    (!node?.modifiers ||
      !hasModifier(node.modifiers, ts.SyntaxKind.AbstractKeyword)) && !node.body
  ) throw new TypeStripError("overload");
  if (node.typeParameters) {
    strip.push({
      start: node.typeParameters.pos - 1, // <
      end: node.typeParameters.end,
      trailing: /,?\s*\>/
    });
    node.typeParameters.forEach((t) => skip.add(t));
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
    skip.add(node.type);
  }
};

const visitCallExpression = (node: ts.CallExpression) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
    node.typeArguments.forEach((t) => skip.add(t));
  }
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
) => {
  // Check if it has a declare modifier first
  if (node.modifiers) {
    visitModifiers(node.modifiers);
  }

  if (node.typeParameters) {
    strip.push({
      start: node.typeParameters.pos - 1,
      end: node.typeParameters.end + 1,
    });
    node.typeParameters.forEach((t) => skip.add(t));
  }
};

const visitHeritageClause = (node: ts.HeritageClause) => {
  if (node.token === ts.SyntaxKind.ImplementsKeyword) {
    strip.push({ start: node.pos, end: node.end });
    skip.add(node);
  }
};

const visitModifiers = (node: ts.NodeArray<ts.ModifierLike>) => {
  if (hasModifier(node, ts.SyntaxKind.DeclareKeyword)) {
    throw new TypeStripError("declare");
  }
  if (hasModifier(node, ts.SyntaxKind.AccessorKeyword)) {
    throw new TypeStripError("accessor-keyword");
  }
  if (hasModifier(node, ts.SyntaxKind.Decorator)) {
    throw new TypeStripError("decorator");
  }

  for (const modifier of node) {
    if (
      modifier.kind === ts.SyntaxKind.PublicKeyword ||
      modifier.kind === ts.SyntaxKind.PrivateKeyword ||
      modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
      modifier.kind === ts.SyntaxKind.ReadonlyKeyword ||
      modifier.kind === ts.SyntaxKind.OverrideKeyword ||
      modifier.kind === ts.SyntaxKind.AbstractKeyword
    ) {
      strip.push({ start: modifier.pos, end: modifier.end });
    }
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
const visitPropertyDeclaration = (node: ts.PropertyDeclaration) => {
  if (node.modifiers) {
    visitModifiers(node.modifiers);
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.exclamationToken) {
    strip.push({
      start: node.exclamationToken.pos,
      end: node.exclamationToken.end,
    });
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
    skip.add(node.type);
  }
};

/**
 * Handle new Expression
 *
 * @example
 * new Box<string>("hello")
 */
const visitNewExpression = (
  node: ts.NewExpression,
) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
    node.typeArguments.forEach((t) => skip.add(t));
  }
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
