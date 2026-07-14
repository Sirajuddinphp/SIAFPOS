import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;
const saltLength = 16;
const scryptOptions = {
  N: 16384,
  r: 8,
  p: 1
} as const;

export function hashSecret(secret: string): string {
  const salt = randomBytes(saltLength).toString("hex");
  const hash = scryptSync(secret, salt, keyLength, scryptOptions).toString("hex");
  return `scrypt$${scryptOptions.N}$${scryptOptions.r}$${scryptOptions.p}$${salt}$${hash}`;
}

export function verifySecret(secret: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, nValue, rValue, pValue, salt, hash] = parts;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(secret, salt, expected.length, {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue)
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const hashPassword = hashSecret;
export const verifyPassword = verifySecret;
export const hashPin = hashSecret;
export const verifyPin = verifySecret;
