import { randomBytes } from "node:crypto";

import {
  developmentCameraHandoffPath,
  isDevelopmentCameraHandoffToken,
  quickTunnelOrigin
} from "@/shared/lib/development-https";

interface HandoffEntry {
  expiresAt: number;
  userId: string;
}

interface DevelopmentCameraHandoffStoreOptions {
  now?: () => number;
  tokenFactory?: () => string;
  ttlMs?: number;
}

export class DevelopmentCameraHandoffStore {
  private readonly entries = new Map<string, HandoffEntry>();
  private readonly now: () => number;
  private readonly tokenFactory: () => string;
  private readonly ttlMs: number;

  constructor({
    now = Date.now,
    tokenFactory = () => randomBytes(32).toString("base64url"),
    ttlMs = 60_000
  }: DevelopmentCameraHandoffStoreOptions = {}) {
    this.now = now;
    this.tokenFactory = tokenFactory;
    this.ttlMs = ttlMs;
  }

  issue(userId: string): string {
    const now = this.now();

    for (const [token, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(token);
      }
    }

    const token = this.tokenFactory();

    if (!isDevelopmentCameraHandoffToken(token)) {
      throw new Error("Development camera handoff generated an invalid token");
    }

    this.entries.set(token, { expiresAt: now + this.ttlMs, userId });
    return token;
  }

  consume(token: string): string | null {
    const entry = this.entries.get(token);

    if (!entry) {
      return null;
    }

    this.entries.delete(token);
    return entry.expiresAt > this.now() ? entry.userId : null;
  }
}

interface HandoffGlobal {
  __autoSpendingsCameraHandoffs?: DevelopmentCameraHandoffStore;
}

const handoffGlobal = globalThis as typeof globalThis & HandoffGlobal;

export const developmentCameraHandoffs =
  handoffGlobal.__autoSpendingsCameraHandoffs ??= new DevelopmentCameraHandoffStore();

export function buildDevelopmentCameraHandoffUrl(origin: unknown, token: string): string | null {
  const trustedOrigin = quickTunnelOrigin(origin);

  if (!trustedOrigin || !isDevelopmentCameraHandoffToken(token)) {
    return null;
  }

  const url = new URL(developmentCameraHandoffPath, trustedOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}
