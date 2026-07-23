import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const pinPattern = /^\d{6}$/;
const keyLength = 64;
const scryptOptions = { N: 16_384, p: 1, r: 8 };

function deriveKey(pin: string, salt: Buffer, length = keyLength): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(pin, salt, length, scryptOptions, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function assertPin(pin: string): void {
  if (!pinPattern.test(pin)) {
    throw new Error("PIN must contain six digits");
  }
}

export async function hashPin(pin: string): Promise<string> {
  assertPin(pin);

  const salt = randomBytes(16);
  const key = await deriveKey(pin, salt);

  return [
    "scrypt",
    String(scryptOptions.N),
    String(scryptOptions.r),
    String(scryptOptions.p),
    salt.toString("base64url"),
    key.toString("base64url")
  ].join("$");
}

export async function verifyPin(pin: string, credential: string): Promise<boolean> {
  if (!pinPattern.test(pin)) {
    return false;
  }

  const [algorithm, cost, blockSize, parallelization, encodedSalt, encodedKey] = credential.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !encodedSalt ||
    !encodedKey
  ) {
    return false;
  }

  const expectedKey = Buffer.from(encodedKey, "base64url");
  const optionsMatch =
    Number(cost) === scryptOptions.N &&
    Number(blockSize) === scryptOptions.r &&
    Number(parallelization) === scryptOptions.p;

  if (!optionsMatch || expectedKey.length !== keyLength) {
    return false;
  }

  const derivedKey = await deriveKey(pin, Buffer.from(encodedSalt, "base64url"));

  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}
