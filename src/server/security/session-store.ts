import type { DataSource, EntityManager } from "typeorm";

import { Session } from "@/server/database/entities";

import { createSessionToken, hashSessionToken } from "./session";

const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

export interface ActiveSession {
  expiresAt: Date;
  token: string;
  userId: string;
}

export async function createSession(
  database: DataSource | EntityManager,
  userId: string
): Promise<ActiveSession> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await database.getRepository(Session).save({
    expiresAt,
    tokenHash: hashSessionToken(token),
    userId
  });

  return { expiresAt, token, userId };
}

export async function getSessionUserId(
  database: DataSource,
  token: string
): Promise<string | null> {
  const repository = database.getRepository(Session);
  const session = await repository.findOneBy({ tokenHash: hashSessionToken(token) });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await repository.delete(session.id);
    return null;
  }

  return session.userId;
}

export async function destroySession(database: DataSource, token: string): Promise<void> {
  await database.getRepository(Session).delete({ tokenHash: hashSessionToken(token) });
}

export function getSessionDurationSeconds(): number {
  return sessionDurationMs / 1000;
}
