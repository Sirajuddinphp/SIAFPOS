import { describe, expect, it } from "vitest";
import { validateIpcInput } from "../electron/security/ipc-validation";
import { cancelKotSchema, kotOrderRefSchema, kotRefSchema } from "../shared/schemas/kot-schemas";

describe("kot validation", () => {
  it("accepts valid payloads", () => {
    const orderPayload = validateIpcInput(kotOrderRefSchema, {
      orderUuid: "11111111-1111-4111-8111-111111111111"
    });
    const ticketPayload = validateIpcInput(kotRefSchema, {
      kotUuid: "22222222-2222-4222-8222-222222222222"
    });
    const cancelPayload = validateIpcInput(cancelKotSchema, {
      kotUuid: "33333333-3333-4333-8333-333333333333",
      reason: "Printer resend"
    });

    expect(orderPayload.orderUuid).toContain("1111");
    expect(ticketPayload.kotUuid).toContain("2222");
    expect(cancelPayload.reason).toBe("Printer resend");
  });

  it("rejects invalid payloads", () => {
    expect(() => validateIpcInput(kotOrderRefSchema, { orderUuid: "bad" })).toThrow();
    expect(() => validateIpcInput(kotRefSchema, { kotUuid: "bad" })).toThrow();
    expect(() => validateIpcInput(cancelKotSchema, { kotUuid: "bad" })).toThrow();
  });
});
