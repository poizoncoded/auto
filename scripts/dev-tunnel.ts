import { spawn } from "node:child_process";

import {
  extractQuickTunnelUrl,
  removeDevelopmentHttpsUrl,
  writeDevelopmentHttpsUrl
} from "../src/server/development/https-tunnel.ts";

await removeDevelopmentHttpsUrl();

const tunnel = spawn(
  "docker",
  ["compose", "--profile", "https", "up", "--force-recreate", "https"],
  { stdio: ["inherit", "pipe", "pipe"] }
);
let recentOutput = "";
let publishedUrl: string | null = null;
let stateWrite = Promise.resolve();
let stopping = false;

function forwardOutput(chunk: Buffer, destination: NodeJS.WriteStream): void {
  destination.write(chunk);
  recentOutput = `${recentOutput}${chunk.toString("utf8")}`.slice(-8192);
  const url = extractQuickTunnelUrl(recentOutput);

  if (url && url !== publishedUrl) {
    publishedUrl = url;
    stateWrite = stateWrite.then(() => writeDevelopmentHttpsUrl(url));
  }
}

tunnel.stdout.on("data", (chunk: Buffer) => forwardOutput(chunk, process.stdout));
tunnel.stderr.on("data", (chunk: Buffer) => forwardOutput(chunk, process.stderr));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    stopping = true;
    tunnel.kill("SIGTERM");
  });
}

const exitCode = await new Promise<number>((resolve, reject) => {
  tunnel.once("error", reject);
  tunnel.once("exit", (code) => resolve(code ?? (stopping ? 0 : 1)));
});

await stateWrite;
await removeDevelopmentHttpsUrl();
process.exitCode = exitCode;
