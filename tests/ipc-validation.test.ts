import { describe, expect, it } from "vitest";
import { passwordLoginSchema } from "../shared/schemas/auth-schemas";
import { validateIpcInput } from "../electron/security/ipc-validation";

describe("IPC validation", () => {
  it("accepts valid password login payloads", () => {
    const payload = validateIpcInput(passwordLoginSchema, {
      restaurantCode: "MH5-DEMO",
      outletCode: "MAIN",
      terminalCode: "POS-01",
      username: "admin",
      password: "admin123",
      rememberTerminal: true
    });

    expect(payload.username).toBe("admin");
  });

  it("rejects unvalidated payloads", () => {
    expect(() => validateIpcInput(passwordLoginSchema, { username: "admin" })).toThrow();
  });
});
