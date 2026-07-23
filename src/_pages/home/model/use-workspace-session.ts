import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiRequestError, requestJson, type PublicUser } from "@/shared/api/auto";

import { getBrowserStorage } from "./browser-storage";
import {
  clearLocalSessionLock,
  isLocalSessionLocked,
  markLocalSessionLocked
} from "./local-lock";

export type SessionStatus = "initializing" | "locked" | "ready";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить запрос";
}

function readLocalLock(storage: Storage | null): boolean {
  try {
    return storage ? isLocalSessionLocked(storage) : false;
  } catch {
    return false;
  }
}

function clearLocalLock(storage: Storage | null): void {
  try {
    if (storage) {
      clearLocalSessionLock(storage);
    }
  } catch {
    // A server session remains usable when browser storage is unavailable.
  }
}

function writeLocalLock(storage: Storage | null): void {
  try {
    if (storage) {
      markLocalSessionLocked(storage);
    }
  } catch {
    // The logout request still invalidates the server session.
  }
}

export function useWorkspaceSession() {
  const storage = useMemo(() => getBrowserStorage(), []);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("initializing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (): Promise<PublicUser[]> => {
    const response = await requestJson<{ users: PublicUser[] }>("/api/users");
    setUsers(response.users);
    return response.users;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize(): Promise<void> {
      const usersRequest = requestJson<{ users: PublicUser[] }>("/api/users");
      const locallyLocked = readLocalLock(storage);
      const sessionRequest = locallyLocked
        ? Promise.resolve<PublicUser | null>(null)
        : requestJson<{ user: PublicUser }>("/api/auth/me")
            .then((response) => response.user)
            .catch((caught: unknown) => {
              if (caught instanceof ApiRequestError && caught.status === 401) {
                return null;
              }

              throw caught;
            });
      const [usersResult, sessionResult] = await Promise.allSettled([
        usersRequest,
        sessionRequest
      ]);

      if (cancelled) {
        return;
      }

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.users);
      } else {
        setError(errorMessage(usersResult.reason));
      }

      if (sessionResult.status === "fulfilled" && sessionResult.value) {
        setUser(sessionResult.value);
        setStatus("ready");
        return;
      }

      if (sessionResult.status === "rejected") {
        setError(errorMessage(sessionResult.reason));
      }

      setUser(null);
      setStatus("locked");
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const login = useCallback(
    async (userId: string, pin: string): Promise<void> => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await requestJson<{ user: PublicUser }>("/api/auth/login", {
          body: { pin, userId },
          method: "POST"
        });
        clearLocalLock(storage);
        setUser(response.user);
        setStatus("ready");
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setSubmitting(false);
      }
    },
    [storage]
  );

  const register = useCallback(
    async (displayName: string, pin: string): Promise<void> => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await requestJson<{ user: PublicUser }>("/api/auth/register", {
          body: { displayName, pin },
          method: "POST"
        });
        clearLocalLock(storage);
        setUser(response.user);
        setStatus("ready");
        await loadUsers().catch(() => undefined);
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setSubmitting(false);
      }
    },
    [loadUsers, storage]
  );

  const lock = useCallback(async (): Promise<void> => {
    writeLocalLock(storage);
    setUser(null);
    setStatus("locked");
    setError(null);

    try {
      await requestJson("/api/auth/logout", { method: "POST" });
    } catch {
      // The local marker keeps the profile locked until an explicit login.
    }

    await loadUsers().catch(() => undefined);
  }, [loadUsers, storage]);

  return {
    error,
    lock,
    login,
    register,
    status,
    submitting,
    user,
    users
  };
}
