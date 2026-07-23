export function getBrowserStorage(readStorage: () => Storage = () => window.localStorage): Storage | null {
  try {
    return readStorage();
  } catch {
    return null;
  }
}
