import ts from "typescript";
import { TypeStripError } from "./errors.ts";

/**
 * Stripping Options
 */
export type TypeStripOptions = {
  /**
   * Whether to strip comments
   */
  removeComments?: boolean;
};

type StripItem = { start: number; end: number; trailing?: RegExp };

const defaultOptions: Required<TypeStripOptions> = {
  removeComments: false,
};

let sourceFile: ts.SourceFile;
let sourceCode: string;
let outputCode: string;
let strip: StripItem[] = [];

/**
 * Takes a TypeScript input source file and outputs JavaScript with types stripped
 *
 * Throws if the code is not forward compatible with the TC39 type annotations proposal
 */
export default (
  input: string,
  options?: TypeStripOptions,
): string => {
  const optionsWitDefaults = { ...defaultOptions, ...options };

  sourceFile = ts.createSourceFile(
    "input.ts",
    input,
    ts.ScriptTarget.Latest,
    false, // setParentNodes
    ts.ScriptKind.TS,
  );

  sourceCode = sourceFile.getFullText();
  outputCode = "";
  strip = [];

  for (const statement of sourceFile.statements) {
    topLevelVisitor(statement);
  }

  let index = 0;
  for (const { start, end, trailing } of strip) {
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
};

const topLevelVisitor = (node: ts.Node) => {
  switch (node?.kind) {
    case ts.SyntaxKind.ExportDeclaration:
      visitExportDeclaration(node as ts.ExportDeclaration);
      break;
    case ts.SyntaxKind.ImportDeclaration:
      visitImportDeclaration(node as ts.ImportDeclaration);
      break;
    default:
      visitor(node);
  }
};

const visitor = (node: ts.Node) => {
  switch (node.kind) {
    case ts.SyntaxKind.Identifier:
      return;

    case ts.SyntaxKind.VariableStatement:
      return visitVariableStatement(node as ts.VariableStatement);
    case ts.SyntaxKind.VariableDeclaration:
      return visitVariableDeclaration(node as ts.VariableDeclaration);

    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
      strip.push({ start: node.pos, end: node.end });
      return;

    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.AsExpression:
    case ts.SyntaxKind.SatisfiesExpression:
      strip.push({
        start: (node as ts.AsExpression).expression.end,
        end: node.end,
      });
      visitor((node as ts.AsExpression).expression);
      return;

    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.NewExpression:
      return visitCallOrNewExpression(node as ts.CallExpression);

    case ts.SyntaxKind.ExpressionWithTypeArguments:
    case ts.SyntaxKind.TaggedTemplateExpression:
      return visitTypeArguments(
        node as ts.ExpressionWithTypeArguments,
      );

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

    // Unsupported features
    case ts.SyntaxKind.EnumDeclaration:
      throw new TypeStripError("enum");
    case ts.SyntaxKind.ModuleDeclaration:
      throw new TypeStripError("namespace");
    case ts.SyntaxKind.TypeAssertionExpression:
      throw new TypeStripError("type-assertion-expression");
  }

  for (const child of node.getChildren(sourceFile)) {
    if (!ts.isToken(child) && !ts.isIdentifier(child)) {
      visitor(child);
    }
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
  } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    const exportsToSkip = node.exportClause.elements.map(visitExportSpecifier)
      .filter(isNotUndefined);
    if (exportsToSkip?.length === node.exportClause.elements.length) {
      // skip the whole import declaration
      strip.push({ start: node.pos, end: node.end });
    } else {
      for (const skipExport of exportsToSkip) {
        strip.push(skipExport);
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
  } else if (node.importClause) {
    const skipDeclaration = visitImportClause(node.importClause);
    if (skipDeclaration) {
      strip.push({ start: node.pos, end: node.end });
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
  for (const declaration of node.declarationList.declarations) {
    visitVariableDeclaration(declaration)
  }
};

/**
 * Handle variable declaration type annotation
 * @example
 * let x: string = "foo";
 */
const visitVariableDeclaration = (node: ts.VariableDeclaration) => {
  visitor(node.name);

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
  }

  if (node.initializer) {
    visitor(node.initializer);
  }
};

const visitTypeArguments = (
  node: ts.ExpressionWithTypeArguments | ts.TaggedTemplateExpression,
) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
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
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
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
  let hasAbstractModifier = false;
  // Check if it has a declare modifier first
  if (node.modifiers) {
    hasAbstractModifier = visitModifiers(node.modifiers);
    if (ts.isMethodDeclaration(node) && hasAbstractModifier) {
      strip.push({
        start: node.pos,
        end: node.end,
      });
    }
  }
  if (node.name && !ts.isIdentifier(node.name)) {
    visitor(node.name);
  }
  if (node.typeParameters) {
    strip.push({
      start: node.typeParameters.pos - 1, // <
      end: node.typeParameters.end,
      trailing: /,?\s*\>/,
    });
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.parameters) {
    for (const parameter of node.parameters) {
      visitParameter(parameter);
    }
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
  }
  if (node.body) {
    visitor(node.body);
  } else if (!hasAbstractModifier) throw new TypeStripError("overload");
};

const visitCallOrNewExpression = (
  node: ts.CallExpression | ts.NewExpression,
) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
  }
  if (node.arguments) {
    for (const argument of node.arguments) {
      if (!ts.isIdentifier(argument)) {
        visitor(argument);
      }
    }
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
const visitClassLike = (node: ts.ClassLikeDeclaration) => {
  // Check if it has a declare modifier first
  if (node.modifiers) {
    visitModifiers(node.modifiers);
  }

  if (node.typeParameters) {
    strip.push({
      start: node.typeParameters.pos - 1,
      end: node.typeParameters.end,
      trailing: /,?\s*\>/,
    });
  }

  if (node.heritageClauses) {
    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
        strip.push({ start: clause.pos, end: clause.end });
      }
    }
  }

  if (node.members) {
    for (const member of node.members) {
      switch (member.kind) {
        case ts.SyntaxKind.IndexSignature:
          strip.push({ start: member.pos, end: member.end });
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          visitPropertyDeclaration(member as ts.PropertyDeclaration);
          break;
        default:
          visitor(member);
          break;
      }
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
  if (!ts.isIdentifier(node.name)) {
    visitor(node.name);
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
  }
};

const visitModifiers = (node: ts.NodeArray<ts.ModifierLike>) => {
  let hasAbstractModifier = false;

  for (const modifier of node) {
    if (modifier.kind === ts.SyntaxKind.DeclareKeyword) {
      throw new TypeStripError("declare");
    }
    if (modifier.kind === ts.SyntaxKind.AccessorKeyword) {
      throw new TypeStripError("accessor-keyword");
    }
    if (modifier.kind === ts.SyntaxKind.Decorator) {
      throw new TypeStripError("decorator");
    }
    if (
      modifier.kind === ts.SyntaxKind.PublicKeyword ||
      modifier.kind === ts.SyntaxKind.PrivateKeyword ||
      modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
      modifier.kind === ts.SyntaxKind.ReadonlyKeyword ||
      modifier.kind === ts.SyntaxKind.OverrideKeyword
    ) {
      strip.push({ start: modifier.pos, end: modifier.end });
    } else if (modifier.kind === ts.SyntaxKind.AbstractKeyword) {
      strip.push({ start: modifier.pos, end: modifier.end });
      hasAbstractModifier = true;
    }
  }
  return hasAbstractModifier;
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
