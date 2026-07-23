import { readFileSync } from "node:fs";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

interface MprocsProcess {
  cmd?: string[];
}

interface MprocsConfiguration {
  procs?: Record<string, MprocsProcess>;
}

interface ComposeService {
  command?: string[];
  extra_hosts?: string[];
  image?: string;
  profiles?: string[];
}

interface ComposeConfiguration {
  services?: Record<string, ComposeService>;
}

interface ProjectPackage {
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

function readProjectFile(path: string): string {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

describe("mprocs development workflow", () => {
  it("starts exactly the frontend and backend processes", () => {
    const configuration = parse(readProjectFile("mprocs.yaml")) as MprocsConfiguration;

    expect(Object.keys(configuration.procs ?? {})).toEqual(["fe", "be"]);
    expect(configuration.procs).toEqual({
      fe: { cmd: ["npm", "run", "dev:fe"] },
      be: { cmd: ["npm", "run", "dev:be"] }
    });
  });

  it("pins the frontend and prepares a healthy migrated backend", () => {
    const projectPackage = JSON.parse(readProjectFile("package.json")) as ProjectPackage;

    expect(projectPackage.scripts).toMatchObject({
      dev: "mprocs --config mprocs.yaml",
      "dev:rebuild": "node scripts/rebuild-astro.ts && node ./node_modules/astro/bin/astro.mjs sync",
      "predev:fe": "npm run dev:rebuild",
      "dev:fe":
        "node --env-file-if-exists=.env ./node_modules/astro/bin/astro.mjs dev --host 0.0.0.0 --port 4321 --force",
      "dev:lan": "npm run dev:fe",
      "predev:lan:alt": "npm run dev:rebuild",
      "dev:lan:alt":
        "node --env-file-if-exists=.env ./node_modules/astro/bin/astro.mjs dev --host 0.0.0.0 --port 4322 --force",
      "dev:be":
        "npm run db:up && npm run db:migrate && docker compose logs --follow --tail 50 db",
      "db:up": "docker compose up --detach --wait db",
      "db:down": "docker compose down"
    });
    expect(projectPackage.devDependencies).toMatchObject({
      mprocs: "0.9.6",
      yaml: "2.9.0"
    });
  });

  it("offers an opt-in trusted HTTPS workflow for a real mobile camera", () => {
    const projectPackage = JSON.parse(readProjectFile("package.json")) as ProjectPackage;
    const configuration = parse(readProjectFile("mprocs.https.yaml")) as MprocsConfiguration;
    const compose = parse(readProjectFile("docker-compose.yml")) as ComposeConfiguration;

    expect(projectPackage.scripts).toMatchObject({
      "dev:https": "mprocs --config mprocs.https.yaml",
      "dev:tunnel": "node scripts/dev-tunnel.ts"
    });
    expect(configuration.procs).toEqual({
      fe: { cmd: ["npm", "run", "dev:fe"] },
      be: { cmd: ["npm", "run", "dev:be"] },
      https: { cmd: ["npm", "run", "dev:tunnel"] }
    });
    expect(compose.services?.https).toEqual({
      image: "cloudflare/cloudflared:2026.7.0",
      profiles: ["https"],
      command: [
        "tunnel",
        "--no-autoupdate",
        "--url",
        "http://host.docker.internal:4321"
      ],
      extra_hosts: ["host.docker.internal:host-gateway"]
    });
    expect(readProjectFile("astro.config.mjs")).toContain(
      'allowedHosts: [".trycloudflare.com"]'
    );
  });

  it("rebuilds generated Astro and Vite state before frontend dev starts", () => {
    const rebuildScript = readProjectFile("scripts/rebuild-astro.ts");

    expect(rebuildScript).toContain("\".astro\"");
    expect(rebuildScript).toContain("\"node_modules/.vite\"");
    expect(rebuildScript).toContain("Refusing to remove path outside the project root");
  });

  it("cleans stale development workers without claiming browser storage", () => {
    const workspaceDocument = readProjectFile("src/_pages/home/ui/WorkspaceDocument.astro");

    expect(workspaceDocument).not.toMatch(/sessionStor[a]ge/);
    expect(workspaceDocument).toContain("history.replaceState");
  });
});
