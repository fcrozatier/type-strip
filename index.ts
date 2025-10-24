import ts from "typescript";
import { TypeStripError } from "./errors.ts";
import { relative } from "@std/path/relative";
import { dirname } from "@std/path/dirname";
import { isAbsolute } from "@std/path/is-absolute";

const SyntaxKind = ts.SyntaxKind;

/**
 * `Type-Strip` Options
 */
export type TypeStripOptions = {
  /**
   * Whether to strip comments
   *
   * @default false
   */
  removeComments?: boolean;
  /**
   * Whether to rewrite .ts module imports to .js imports
   *
   * @default false
   */
  pathRewriting?: boolean;
  /**
   * Whether and how to expand aliases in import specifiers
   */
  remapSpecifiers?: {
    /**
     * The path of the file being stripped.
     */
    filePath: string;
    /**
     * A map of specifiers to their remapped specifiers
     *
     * Relative paths for substitutions are specified with respect to the `deno.json` file
     *
     * @example
     *
     * Given the file structure:
     *
     * ```
     * ├ deno.json
     * ├ a.ts
     * └ lib/
     *    └ foo/
     *      ├ b.ts
     *      └ bar.ts
     * ```
     *
     * Where `a.ts` and `b.ts` both contain:
     *
     * ```ts
     * "import '$foo/bar.ts'"
     * ```
     *
     * With the option `{ imports: { '$foo/': "./lib/foo/" }` the aliases are substituted as expected:
     *
     * ```ts
     * import stripTypes from '@fcrozatier/type-strip';
     *
     * stripTypes(fileA, {
     *   pathRewriting: true,
     *   remapSpecifiers: {
     *     filePath: './a.ts',
     *     imports: { '$foo/': "./lib/foo/" }
     *   }
     * });
     * // input: import '$foo/bar.ts'
     * // output: import './lib/foo/bar.js'
     *
     * stripTypes(fileB, {
     *   pathRewriting: true,
     *   remapSpecifiers: {
     *     filePath: './lib/b.ts',
     *     imports: { '$foo/': "./lib/foo/" } });
     *   }
     * // input: import '$foo/bar.ts'
     * // output: import './bar.js'
     * ```
     */
    imports: Record<string, string>;
  };
  /**
   * @deprecated Use pathRewriting instead
   */
  tsToJsModuleSpecifiers?: boolean;
};

let sourceFile: ts.SourceFile;
let sourceCode: string;
let outputCode: string;
let removeComments: boolean;
let pathRewriting: boolean;
let filePath: string;
let imports: [string, string][] | undefined;

type StripItem = { start: number; end: number; trailing?: RegExp };
const strip: StripItem[] = [];

type TransformSpecifier = {
  pos: number;
  alias: RegExp;
  replacement: string;
};
const transformSpecifiers: TransformSpecifier[] = [];

/**
 * Takes a TypeScript input source file and outputs JavaScript with types stripped
 *
 * Throws if the code is not forward compatible with the TC39 type annotations proposal
 */
export default (
  input: string,
  options?: TypeStripOptions,
): string => {
  sourceFile = ts.createSourceFile(
    "input.ts",
    input,
    ts.ScriptTarget.Latest,
    false, // setParentNodes
    ts.ScriptKind.TS,
  );

  removeComments = options?.removeComments ?? false;
  pathRewriting = (options?.pathRewriting || options?.tsToJsModuleSpecifiers) ??
    false;
  const remapSpecifiers = options?.remapSpecifiers;

  if (remapSpecifiers) {
    imports = Object.entries(remapSpecifiers.imports);
    filePath = remapSpecifiers.filePath;
  }

  sourceCode = sourceFile.getFullText();
  outputCode = "";
  strip.length = 0;
  transformSpecifiers.length = 0;

  const statements = sourceFile.statements;
  for (let i = 0; i < statements.length; i++) {
    topLevelVisitor(statements[i]);
  }

  transformSpecifiers.reverse();
  let currentSpecifierTransform = transformSpecifiers.pop();

  let currentIndex = 0;
  for (let i = 0; i < strip.length; i++) {
    const { start, end, trailing } = strip[i];

    if (start !== undefined && end !== undefined) {
      if (currentIndex < start) {
        let chunk = sourceCode.slice(currentIndex, start);

        while (
          currentSpecifierTransform &&
          currentSpecifierTransform.pos >= currentIndex &&
          currentSpecifierTransform.pos < start
        ) {
          chunk = chunk.replace(
            currentSpecifierTransform.alias,
            "$1" +
              currentSpecifierTransform.replacement,
          );
          currentSpecifierTransform = transformSpecifiers.pop();
        }

        outputCode += chunk;
        currentIndex = end;
      }
      if (currentIndex < end) {
        currentIndex = end;
      }
    }
    if (trailing) {
      const match = sourceCode.slice(currentIndex).match(trailing);
      if (match) {
        currentIndex += match[0].length;
      }
    }
  }
  if (currentIndex < sourceCode.length) {
    let chunk = sourceCode.slice(currentIndex);

    while (
      currentSpecifierTransform &&
      currentSpecifierTransform.pos >= currentIndex
    ) {
      chunk = chunk.replace(
        currentSpecifierTransform.alias,
        "$1" + currentSpecifierTransform.replacement,
      );
      currentSpecifierTransform = transformSpecifiers.pop();
    }

    outputCode += chunk;
  }

  return outputCode;
};

const stripComments = (node: ts.Node, kind: "leading" | "trailing") => {
  const commentRanges = kind === "leading"
    ? ts.getLeadingCommentRanges(sourceCode, node.pos)
    : ts.getTrailingCommentRanges(sourceCode, node.end);

  if (commentRanges) {
    for (let i = 0; i < commentRanges.length; i++) {
      const commentRange = commentRanges[i];
      strip.push({
        start: commentRange.pos,
        end: commentRange.end,
        trailing: commentRange.hasTrailingNewLine ? /\n?/ : undefined,
      });
    }
  }
};

const topLevelVisitor = (node: ts.Node) => {
  if (removeComments) {
    stripComments(node, "leading");
  }
  try {
    switch (node.kind) {
      case SyntaxKind.ExportDeclaration:
        return visitExportDeclaration(node as ts.ExportDeclaration);
      case SyntaxKind.ImportDeclaration:
        return visitImportDeclaration(node as ts.ImportDeclaration);
    }
    return visitor(node);
  } finally {
    if (removeComments) {
      stripComments(node, "trailing");
    }
  }
};

const visitor = (node: ts.Node) => {
  if (removeComments) {
    stripComments(node, "leading");
  }
  try {
    switch (node.kind) {
      case SyntaxKind.Identifier:
        return;

      case SyntaxKind.VariableStatement:
        return visitVariableStatement(node as ts.VariableStatement);
      case SyntaxKind.VariableDeclaration:
        return visitVariableDeclaration(node as ts.VariableDeclaration);

      case SyntaxKind.InterfaceDeclaration:
      case SyntaxKind.TypeAliasDeclaration:
        strip.push({ start: node.pos, end: node.end });
        return;

      case SyntaxKind.NonNullExpression:
      case SyntaxKind.AsExpression:
      case SyntaxKind.SatisfiesExpression:
        visitor((node as ts.AsExpression).expression);
        strip.push({
          start: (node as ts.AsExpression).expression.end,
          end: node.end,
        });
        return;

      case SyntaxKind.CallExpression:
        if (
          (node as ts.CallExpression).expression.kind ===
            SyntaxKind.ImportKeyword
        ) {
          return visitImportCallExpression(node as ts.CallExpression);
        }
        return visitCallOrNewExpression(node as ts.CallExpression);
      case SyntaxKind.NewExpression:
        return visitCallOrNewExpression(node as ts.CallExpression);

      case SyntaxKind.ExpressionWithTypeArguments:
        return visitExpressionWithTypeArguments(
          node as ts.ExpressionWithTypeArguments,
        );
      case SyntaxKind.TaggedTemplateExpression:
        return visitTaggedTemplateExpression(
          node as ts.TaggedTemplateExpression,
        );

      case SyntaxKind.FunctionDeclaration:
      case SyntaxKind.MethodDeclaration:
      case SyntaxKind.GetAccessor:
      case SyntaxKind.SetAccessor:
      case SyntaxKind.Constructor:
      case SyntaxKind.FunctionExpression:
      case SyntaxKind.ArrowFunction:
        return visitFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration);

      case SyntaxKind.ClassDeclaration:
      case SyntaxKind.ClassExpression:
        return visitClassLike(node as ts.ClassLikeDeclaration);

      // Unsupported features
      case SyntaxKind.EnumDeclaration:
        throw new TypeStripError("enum");
      case SyntaxKind.ModuleDeclaration:
        throw new TypeStripError("namespace");
      case SyntaxKind.TypeAssertionExpression:
        throw new TypeStripError("type-assertion-expression");
    }

    node.forEachChild((child) => {
      if (!ts.isToken(child) && !ts.isIdentifier(child)) {
        visitor(child);
      }
    });
  } finally {
    if (removeComments) {
      stripComments(node, "trailing");
    }
  }
};

const visitExportDeclaration = (node: ts.ExportDeclaration) => {
  let skipAll: boolean = false;

  if (node.isTypeOnly) {
    skipAll = true;
    strip.push({ start: node.pos, end: node.end });
  } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    const exportsToSkip = node.exportClause.elements.map(visitExportSpecifier)
      .filter(isNotUndefined);
    if (exportsToSkip?.length === node.exportClause.elements.length) {
      skipAll = true;
      strip.push({ start: node.pos, end: node.end });
    } else {
      strip.push(...exportsToSkip);
    }
  }

  const moduleSpecifier = node.moduleSpecifier;

  if (
    moduleSpecifier && ts.isStringLiteral(moduleSpecifier) &&
    (!node.exportClause || skipAll === false)
  ) {
    if (imports) {
      const match = imports.find(([alias]) =>
        moduleSpecifier.text.startsWith(alias)
      );

      if (match) {
        let replacement = match[1];

        // relative path: non absolute path that's not an @alias
        if (!isAbsolute(replacement) && replacement.startsWith(".")) {
          replacement = relative(dirname(filePath), replacement) +
            (replacement.endsWith("/") ? "/" : "");
        }

        transformSpecifiers.push({
          pos: moduleSpecifier.pos,
          alias: new RegExp("(['\"])" + RegExp.escape(match[0])),
          replacement,
        });
      }
    }

    if (pathRewriting) {
      sourceCode = sourceCode.slice(0, moduleSpecifier.pos) +
        ` "${moduleSpecifier.text.replace(/\.ts$/, ".js")}"` +
        sourceCode.slice(moduleSpecifier.end);
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
    } else {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifier = node.moduleSpecifier;

        if (imports) {
          const match = imports.find(([alias]) =>
            moduleSpecifier.text.startsWith(alias)
          );

          if (match) {
            let replacement = match[1];

            // relative path: non absolute path that's not an @alias
            if (!isAbsolute(replacement) && replacement.startsWith(".")) {
              replacement = relative(dirname(filePath), replacement) +
                (replacement.endsWith("/") ? "/" : "");
            }

            transformSpecifiers.push({
              pos: moduleSpecifier.pos,
              alias: new RegExp("(['\"])" + RegExp.escape(match[0])),
              replacement,
            });
          }
        }

        if (pathRewriting) {
          sourceCode = sourceCode.slice(0, moduleSpecifier.pos) +
            ` "${moduleSpecifier.text.replace(/\.ts$/, ".js")}"` +
            sourceCode.slice(moduleSpecifier.end);
        }
      }
    }
  }
};

const visitImportCallExpression = (node: ts.CallExpression) => {
  if (pathRewriting) {
    if (ts.isStringLiteral(node.arguments[0])) {
      const moduleSpecifier = node.arguments[0];

      sourceCode = sourceCode.slice(0, moduleSpecifier.pos) +
        `"${moduleSpecifier.text.replace(/\.ts$/, ".js")}"` +
        sourceCode.slice(moduleSpecifier.end);
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
      strip.push(...importsToSkip);
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
    node.modifiers && hasModifier(node.modifiers, SyntaxKind.DeclareKeyword)
  ) {
    throw new TypeStripError("declare");
  }
  const declarations = node.declarationList.declarations;
  for (let i = 0; i < declarations.length; i++) {
    visitVariableDeclaration(declarations[i]);
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

const visitExpressionWithTypeArguments = (
  node: ts.ExpressionWithTypeArguments,
) => {
  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
  }
  visitor(node.expression);
};

const visitTaggedTemplateExpression = (
  node: ts.TaggedTemplateExpression,
) => {
  visitor(node.tag);

  if (node.typeArguments) {
    strip.push({
      start: node.typeArguments.pos - 1,
      end: node.typeArguments.end + 1,
    });
  }

  visitor(node.template);
};

const visitParameter = (node: ts.ParameterDeclaration) => {
  if (
    node.modifiers &&
    hasModifier(node.modifiers, [
      SyntaxKind.PublicKeyword,
      SyntaxKind.PrivateKeyword,
      SyntaxKind.ProtectedKeyword,
      SyntaxKind.ReadonlyKeyword,
      SyntaxKind.OverrideKeyword,
    ])
  ) {
    throw new TypeStripError("parameter-property");
  }

  if (ts.isIdentifier(node.name) && node.name.escapedText === "this") {
    strip.push({ start: node.pos, end: node.end, trailing: /,?\s*/ });
  } else if (!ts.isIdentifier(node.name)) {
    visitor(node.name);
  }
  if (node.questionToken) {
    strip.push({ start: node.questionToken.pos, end: node.questionToken.end });
  }
  if (node.type) {
    strip.push({ start: node.type.pos - 1, end: node.type.end });
  }
  if (node.initializer) {
    visitor(node.initializer);
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
    if (
      hasAbstractModifier &&
      (ts.isMethodDeclaration(node) || ts.isGetAccessor(node) ||
        ts.isSetAccessor(node))
    ) {
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
    const parameters = node.parameters;
    for (let i = 0; i < parameters.length; i++) {
      visitParameter(parameters[i]);
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
      end: node.typeArguments.end,
      trailing: /\s*\>/,
    });
  }
  if (node.expression) {
    visitor(node.expression);
  }
  if (node.arguments) {
    const args = node.arguments;
    for (let i = 0; i < args.length; i++) {
      const argument = args[i];
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
    const heritageClauses = node.heritageClauses;
    for (let i = 0; i < heritageClauses.length; i++) {
      const heritageClause = heritageClauses[i];

      if (heritageClause.token === SyntaxKind.ImplementsKeyword) {
        strip.push({ start: heritageClause.pos, end: heritageClause.end });
      } else {
        const children = heritageClause.types;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          visitor(child);
        }
      }
    }
  }

  if (node.members) {
    const members = node.members;
    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      switch (member.kind) {
        case SyntaxKind.IndexSignature:
          strip.push({ start: member.pos, end: member.end });
          break;
        case SyntaxKind.PropertyDeclaration:
          if (removeComments) {
            stripComments(member, "leading");
          }
          visitPropertyDeclaration(member as ts.PropertyDeclaration);
          if (removeComments) {
            stripComments(member, "trailing");
          }
          break;
        default:
          visitor(member);
          break;
      }
    }
  }
};

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
  if (node.initializer) {
    visitor(node.initializer);
  }
};

const visitModifiers = (node: ts.NodeArray<ts.ModifierLike>) => {
  let hasAbstractModifier = false;

  for (let i = 0; i < node.length; i++) {
    const modifier = node[i];

    if (modifier.kind === SyntaxKind.DeclareKeyword) {
      throw new TypeStripError("declare");
    }
    if (modifier.kind === SyntaxKind.AccessorKeyword) {
      throw new TypeStripError("accessor-keyword");
    }
    if (modifier.kind === SyntaxKind.Decorator) {
      throw new TypeStripError("decorator");
    }
    if (
      modifier.kind === SyntaxKind.PublicKeyword ||
      modifier.kind === SyntaxKind.PrivateKeyword ||
      modifier.kind === SyntaxKind.ProtectedKeyword ||
      modifier.kind === SyntaxKind.ReadonlyKeyword ||
      modifier.kind === SyntaxKind.OverrideKeyword
    ) {
      strip.push({ start: modifier.pos, end: modifier.end });
    } else if (modifier.kind === SyntaxKind.AbstractKeyword) {
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
