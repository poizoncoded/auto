import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface ComposePort {
  host_ip?: string;
  published?: string;
  target?: number;
}

interface ComposeConfiguration {
  services?: {
    db?: {
      container_name?: string;
      image?: string;
      ports?: ComposePort[];
      volumes?: Array<{ target?: string }>;
    };
  };
}

describe("PostgreSQL Compose exposure", () => {
  it("runs PostgreSQL 18 and publishes it only on the loopback interface", () => {
    const output = execFileSync("docker", ["compose", "config", "--format", "json"], {
      encoding: "utf8"
    });
    const configuration = JSON.parse(output) as ComposeConfiguration;
    const databasePort = configuration.services?.db?.ports?.find((port) => port.target === 5432);

    expect(configuration.services?.db?.container_name).toBe("auto-spendings-postgres");
    expect(configuration.services?.db?.image).toBe("postgres:18-alpine");
    expect(databasePort).toMatchObject({ host_ip: "127.0.0.1", published: "5433" });
    expect(configuration.services?.db?.volumes).toContainEqual(
      expect.objectContaining({ target: "/var/lib/postgresql" })
    );
  });

  it("uses safe local defaults without exposing production credentials", () => {
    const compose = readFileSync(new URL("../../../docker-compose.yml", import.meta.url), "utf8");

    expect(compose).toMatch(/POSTGRES_DB:\s+["']?\$\{POSTGRES_DB:-poizoncoded_auto\}/);
    expect(compose).toMatch(/POSTGRES_USER:\s+["']?\$\{POSTGRES_USER:-auto_spendings\}/);
    expect(compose).toMatch(/POSTGRES_PASSWORD:\s+["']?\$\{POSTGRES_PASSWORD:-auto_spendings_local\}/);
    expect(compose).not.toMatch(/0\.0\.0\.0:5432|^\s*-\s+["']?5432:5432/m);
  });
});
