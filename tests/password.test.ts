import { describe, expect, it } from "vitest";
import { hashPassword, hashPin, verifyPassword, verifyPin } from "../electron/security/password";

describe("password hashing", () => {
  it("hashes and verifies passwords without storing plain text", () => {
    const hash = hashPassword("admin123");

    expect(hash).not.toContain("admin123");
    expect(verifyPassword("admin123", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("hashes and verifies PINs without storing plain text", () => {
    const hash = hashPin("1234");

    expect(hash).not.toContain("1234");
    expect(verifyPin("1234", hash)).toBe(true);
    expect(verifyPin("0000", hash)).toBe(false);
  });
});
