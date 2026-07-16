import { describe, expect, it } from "vitest";
import { activateDeviceSchema, cloudActivationResponseSchema } from "../shared/schemas/activation-schemas";

describe("activation validation", () => {
  it("accepts valid activation input", () => {
    expect(activateDeviceSchema.parse({ restaurantCode: "REST001", licenseKey: "MH5-DEMO-2026", ownerEmail: "owner@example.com", ownerMobile: "+919876543210" })).toBeTruthy();
  });
  it("rejects malformed mobile and restaurant code", () => {
    expect(() => activateDeviceSchema.parse({ restaurantCode: "x!", licenseKey: "short", ownerEmail: "bad", ownerMobile: "abc" })).toThrow();
  });
  it("rejects an incomplete cloud response before local persistence", () => {
    expect(() => cloudActivationResponseSchema.parse({ data: { token: "bad" } })).toThrow();
  });
});
