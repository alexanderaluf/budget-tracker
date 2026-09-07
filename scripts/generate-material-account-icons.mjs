import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageRoot = path.join(
  projectRoot,
  "node_modules",
  "@material-symbols-svg",
  "react-native",
  "dist",
);
const iconDirectory = path.join(packageRoot, "rounded", "icons");
const metadata = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, "metadata", "icon-index.json"),
    "utf8",
  ),
);
const outputPath = path.join(
  projectRoot,
  "src",
  "features",
  "accounts",
  "data",
  "material-rounded-filled-icons.ts",
);

function titleFromName(name) {
  return name
    .split(/[_-]+/)
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

const trailingIconNames = new Set([
  "10k",
  "10mp",
  "11mp",
  "123",
  "12mp",
  "13mp",
  "14mp",
  "15mp",
  "16mp",
  "17mp",
  "18_up_rating",
  "18mp",
  "19mp",
  "1k",
  "1k_plus",
  "1x_mobiledata",
  "1x_mobiledata_badge",
  "20mp",
  "21mp",
  "22mp",
  "23mp",
  "24fps_select",
  "24mp",
  "2d",
  "2d_2",
  "2k",
  "2k_plus",
  "2mp",
  "30fps",
  "30fps_select",
  "360",
  "3d",
  "3d_2",
  "3d_rotation",
  "3g_mobiledata",
  "3g_mobiledata_badge",
  "3k",
  "3k_plus",
  "3mp",
  "3p",
  "4g_mobiledata",
  "4g_mobiledata_badge",
  "4g_plus_mobiledata",
  "4k",
  "4k_plus",
  "4mp",
  "50mp",
  "5g",
  "5g_mobiledata_badge",
  "5k",
  "5k_plus",
  "5mp",
  "6_ft_apart",
  "60fps",
  "60fps_select",
  "6k",
  "6k_plus",
  "6mp",
  "7k",
  "7k_plus",
  "7mp",
  "8k",
  "8k_plus",
  "8mp",
  "9k",
  "9k_plus",
  "9mp",
  "abc",
]);

const icons = Object.entries(metadata)
  .flatMap(([slug, item]) => {
    const sourcePath = path.join(
      iconDirectory,
      `${slug.replaceAll("_", "-")}.js`,
    );
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Missing rounded Material Symbol source: ${item.name}`);
    }

    const source = fs.readFileSync(sourcePath, "utf8");
    const filledStart = source.indexOf("filled:");
    const pathBlockStart =
      filledStart >= 0 ? filledStart : source.indexOf("regular:");
    const weight400 = source
      .slice(pathBlockStart)
      .match(/"400":\s*("(?:\\.|[^"\\])*")/);
    if (pathBlockStart < 0 || !weight400) {
      throw new Error(`Missing rounded filled weight 400 path: ${item.name}`);
    }

    const label = titleFromName(item.name);
    const pathData = JSON.parse(weight400[1]);
    // A few package metadata entries are placeholders with an empty SVG path.
    if (!pathData) return [];

    return [
      {
        name: item.name,
        label,
        searchText:
          `${item.name} ${label} ${item.categories.join(" ")}`.toLowerCase(),
        pathData,
      },
    ];
  })
  .sort((left, right) => {
    const leftIsTrailing = trailingIconNames.has(left.name);
    const rightIsTrailing = trailingIconNames.has(right.name);
    if (leftIsTrailing !== rightIsTrailing) return leftIsTrailing ? 1 : -1;
    return left.label.localeCompare(right.label);
  });

const lines = icons.map((icon) => JSON.stringify(icon)).join(",\n");
const output = `// Generated from @material-symbols-svg/react-native. Do not edit manually.\n// Run: node scripts/generate-material-account-icons.mjs\n\nexport type MaterialRoundedFilledIcon = {\n  name: string;\n  label: string;\n  searchText: string;\n  pathData: string;\n};\n\nexport const MATERIAL_ROUNDED_FILLED_ICONS: readonly MaterialRoundedFilledIcon[] = [\n${lines}\n];\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Generated ${icons.length} rounded filled Material Symbols.`);
