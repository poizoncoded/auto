import { rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedPaths = [".astro", "node_modules/.vite"];

function resolveGeneratedPath(path: string): string {
  const resolved = resolve(projectRoot, path);
  const relativePath = relative(projectRoot, resolved);

  if (!relativePath || relativePath.startsWith("..")) {
    throw new Error(`Refusing to remove path outside the project root: ${path}`);
  }

  return resolved;
}

for (const path of generatedPaths) {
  await rm(resolveGeneratedPath(path), { force: true, recursive: true });
  console.log(`Removed generated dev state: ${path}`);
}
