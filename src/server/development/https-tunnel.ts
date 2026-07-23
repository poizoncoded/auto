import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { quickTunnelOrigin } from "../../shared/lib/development-https.ts";

export const developmentHttpsStateFile = join(tmpdir(), "auto-spendings-https-url.json");

export function extractQuickTunnelUrl(output: string): string | null {
  const candidates = output.match(/https:\/\/[^\s|]+/g) ?? [];

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const origin = quickTunnelOrigin(candidates[index]);

    if (origin) {
      return origin;
    }
  }

  return null;
}

export async function writeDevelopmentHttpsUrl(
  value: string,
  path = developmentHttpsStateFile
): Promise<void> {
  const url = quickTunnelOrigin(value);

  if (!url) {
    throw new Error("Invalid development HTTPS URL");
  }

  await writeFile(path, JSON.stringify({ updatedAt: new Date().toISOString(), url }), "utf8");
}

export async function readDevelopmentHttpsUrl(path = developmentHttpsStateFile): Promise<string | null> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8")) as { url?: unknown };
    return quickTunnelOrigin(parsed.url);
  } catch {
    return null;
  }
}

export async function removeDevelopmentHttpsUrl(path = developmentHttpsStateFile): Promise<void> {
  await rm(path, { force: true });
}
