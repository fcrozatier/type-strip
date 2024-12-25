import benchmark from "./benchmark.json" with { type: "json" };

/**
 * Transform benchmark data into svg polyline data points
 */

// Extract the avg in µs for each benchmark result
const mapped = benchmark.benches.map((b) => ({
  ...b,
  avg: b.results[0].ok.avg / (10 ** 3),
}));

// Limit keys
const keys = ["esbuild", "type-strip"];

// const max = Math.ceil(
//   Math.max(
//     ...mapped.filter((b) => keys.includes(b.name)).map((
//       b,
//     ) => b.avg),
//   ),
// );
// console.log(`max ${max}`); // 4000

const width = 1000;
const height = 500;
const xMax = 2000;
const yMax = 4000;

const groupedByName = Object.groupBy(mapped, ({ name }) => name);
const data: { [key: string]: string } = {};

for (const [key, value] of Object.entries(groupedByName)) {
  if (!keys.includes(key)) continue;

  let points = "";
  for (const element of value!) {
    points += `${width * parseInt(element.group) / xMax},${
      height * (1 - element.avg / yMax)
    } `;
  }
  data[key] = points;
}

Deno.writeTextFileSync("./scripts/plot.json", JSON.stringify(data, null, 2));
