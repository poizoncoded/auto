import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  extractQuickTunnelUrl,
  readDevelopmentHttpsUrl,
  writeDevelopmentHttpsUrl
} from "./https-tunnel";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

async function stateFile(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "auto-spendings-tunnel-test-"));
  temporaryDirectories.push(directory);
  return join(directory, "https-url.json");
}

describe("development HTTPS tunnel state", () => {
  it("extracts the generated Quick Tunnel origin from cloudflared output", () => {
    expect(
      extractQuickTunnelUrl(`Your quick Tunnel has been created!\nhttps://camera-ready.trycloudflare.com`)
    ).toBe("https://camera-ready.trycloudflare.com");
  });

  it.each([
    "http://camera-ready.trycloudflare.com",
    "https://trycloudflare.com",
    "https://camera-ready.trycloudflare.com.evil.example",
    "https://user@camera-ready.trycloudflare.com"
  ])("rejects an unsafe tunnel URL: %s", (url) => {
    expect(extractQuickTunnelUrl(url)).toBeNull();
  });

  it("persists only a validated tunnel origin", async () => {
    const path = await stateFile();

    await writeDevelopmentHttpsUrl("https://camera-ready.trycloudflare.com", path);

    expect(await readDevelopmentHttpsUrl(path)).toBe("https://camera-ready.trycloudflare.com");
    await expect(writeDevelopmentHttpsUrl("https://camera-ready.trycloudflare.com.evil.example", path)).rejects.toThrow(
      "Invalid development HTTPS URL"
    );
  });

  it("treats missing or malformed state as unavailable", async () => {
    const path = await stateFile();

    expect(await readDevelopmentHttpsUrl(path)).toBeNull();
    await writeFile(path, "not json", "utf8");
    expect(await readDevelopmentHttpsUrl(path)).toBeNull();
  });
});
