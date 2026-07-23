export interface LocalLockStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

const localLockKey = "auto-spendings:locally-locked";

export function isLocalSessionLocked(storage: LocalLockStorage): boolean {
  return storage.getItem(localLockKey) === "1";
}

export function markLocalSessionLocked(storage: LocalLockStorage): void {
  storage.setItem(localLockKey, "1");
}

export function clearLocalSessionLock(storage: LocalLockStorage): void {
  storage.removeItem(localLockKey);
}
