import { createHash } from "node:crypto";

import type { DataSource } from "typeorm";

import { AppError } from "@/server/http/error";

export type AuthOperation = "login" | "pin-change" | "register";

export interface AuthAttemptKey {
  clientAddress: string;
  operation: AuthOperation;
  subject?: string;
}

export interface AuthRateLimitPolicy {
  blockMs: number;
  maxAttempts: number;
  windowMs: number;
}

export interface ConsumeAuthAttemptOptions {
  now?: Date;
  policy?: AuthRateLimitPolicy;
}

const defaultPolicy: AuthRateLimitPolicy = {
  blockMs: 15 * 60 * 1000,
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000
};
const uuidSubjectPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function canonicalSubject(subject: string | undefined): string {
  if (!subject) {
    return "";
  }

  return uuidSubjectPattern.test(subject) ? subject.toLowerCase() : subject;
}

function scopeHash(key: AuthAttemptKey): string {
  return createHash("sha256")
    .update(`${key.clientAddress.trim() || "unknown"}\0${canonicalSubject(key.subject)}`)
    .digest("hex");
}

function assertPolicy(policy: AuthRateLimitPolicy): void {
  if (
    !Number.isSafeInteger(policy.maxAttempts) ||
    policy.maxAttempts < 1 ||
    !Number.isSafeInteger(policy.blockMs) ||
    policy.blockMs < 1 ||
    !Number.isSafeInteger(policy.windowMs) ||
    policy.windowMs < 1
  ) {
    throw new Error("Auth rate-limit policy must use positive integer bounds");
  }
}

export async function consumeAuthAttempt(
  database: DataSource,
  key: AuthAttemptKey,
  options: ConsumeAuthAttemptOptions = {}
): Promise<void> {
  const now = options.now ?? new Date();
  const policy = options.policy ?? defaultPolicy;
  assertPolicy(policy);

  const windowExpiresAt = new Date(now.getTime() + policy.windowMs);
  const nextBlockedUntil = new Date(now.getTime() + policy.blockMs);
  const hash = scopeHash(key);

  await database.query("DELETE FROM auth_attempts WHERE expires_at <= $1", [now]);
  const rows = (await database.query(
    `
      INSERT INTO auth_attempts (
        operation,
        scope_hash,
        attempt_count,
        window_started_at,
        blocked_until,
        expires_at,
        updated_at
      )
      VALUES ($1, $2, 1, $3, NULL, $4, $3)
      ON CONFLICT (operation, scope_hash) DO UPDATE SET
        attempt_count = CASE
          WHEN auth_attempts.blocked_until > $3 THEN auth_attempts.attempt_count
          ELSE auth_attempts.attempt_count + 1
        END,
        blocked_until = CASE
          WHEN auth_attempts.blocked_until > $3 THEN auth_attempts.blocked_until
          WHEN auth_attempts.attempt_count + 1 > $5 THEN $6
          ELSE NULL
        END,
        expires_at = CASE
          WHEN auth_attempts.blocked_until > $3
            THEN GREATEST(auth_attempts.expires_at, auth_attempts.blocked_until)
          WHEN auth_attempts.attempt_count + 1 > $5
            THEN GREATEST(auth_attempts.expires_at, $6)
          ELSE auth_attempts.expires_at
        END,
        updated_at = $3
      RETURNING blocked_until
    `,
    [key.operation, hash, now, windowExpiresAt, policy.maxAttempts, nextBlockedUntil]
  )) as Array<{ blocked_until: Date | string | null }>;
  const blockedUntil = rows[0]?.blocked_until;

  if (blockedUntil && new Date(blockedUntil).getTime() > now.getTime()) {
    throw new AppError("Слишком много попыток. Повторите позже", "RATE_LIMITED", 429);
  }
}

export async function resetAuthAttempts(
  database: DataSource,
  key: AuthAttemptKey
): Promise<void> {
  await database.query(
    "DELETE FROM auth_attempts WHERE operation = $1 AND scope_hash = $2",
    [key.operation, scopeHash(key)]
  );
}
