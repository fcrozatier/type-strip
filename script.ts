function generateHugeTypeScriptFile(outputFile: string, numFunctions = 100000) {
  let content = `// Huge self-contained TypeScript file for benchmarking\n\n`;

  // Define a type to be reused
  content +=
    `type User = { id: number; name: string; email: string; active: boolean };\n\n`;

  // Generate many functions using the type
  for (let i = 0; i < numFunctions; i++) {
    content += `function getUser${i}(id: number): User {
  return { id, name: "User" + id, email: "user" + id + "@example.com", active: id % 2 === 0 };
}\n\n`;
  }

  // Write to the output file
  Deno.writeTextFileSync(outputFile, content);
  console.log(`Generated ${outputFile} with ${numFunctions} functions.`);
}

const outputFile = "fixtures.ts";
const numFunctions = 1000;
generateHugeTypeScriptFile(outputFile, numFunctions);
