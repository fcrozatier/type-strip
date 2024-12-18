import ts from "typescript";

type TypeStripOptions = {
  removeComments: boolean;
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
  options: TypeStripOptions = { removeComments: false },
) => {
  sourceFile = ts.createSourceFile(
    "input.ts",
    input,
    ts.ScriptTarget.Latest,
    false, // setParentNodes
    ts.ScriptKind.TS,
  );

  return stripTypes(sourceFile, options);
};

const stripTypes = (
  sourceFile: ts.SourceFile,
  { removeComments }: TypeStripOptions,
) => {
  printer = ts.createPrinter({
    omitTrailingSemicolon: false,
    removeComments,
  });

  const result = ts.transform(sourceFile, [transformer]);
  const transformed = result.transformed[0];

  const output = printer.printFile(transformed as ts.SourceFile);
  result.dispose();
  return output;
};

const transformer =
  <T extends ts.Node>(transformationContext: ts.TransformationContext) =>
  (rootNode: T): ts.Node => {
    context = transformationContext;
    return ts.visitNode(rootNode, visitor);
  };

const visitor = (node: ts.Node): ts.Node => {
  switch (node.kind) {
    // Remove type annotations
    case ts.SyntaxKind.VariableDeclaration:
      return visitVariableDeclaration(node as ts.VariableDeclaration);

    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
      return visitFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration);
  }

  return ts.visitEachChild(node, visitor, context);
};

/**
 * Handle variable declaration type annotation
 * @example
 * let x: string;
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
 * Handle function parameter type annotation
 * @example
 * function equals(x: number, y?: number) {
      return x === y;
    }
 */
const visitParameter = (
  node: ts.ParameterDeclaration,
): ts.ParameterDeclaration => {
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
  const parameters = node.parameters.map((param) => visitParameter(param));

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
  }
  return node;
};
