import { describe, expect, it } from "vitest";
import { activateDeviceSchema, cloudActivationResponseSchema } from "../shared/schemas/activation-schemas";

describe("activation schemas", () => {
  it("validates activation input", () => {
    expect(activateDeviceSchema.parse({ restaurantCode: "REST-1", licenseKey: "LICENSE-123", ownerEmail: "owner@example.com", ownerMobile: "9876543210" }).restaurantCode).toBe("REST-1");
  });

  it("validates cloud activation response", () => {
    const parsed = cloudActivationResponseSchema.parse({ data: { activatedAt: new Date().toISOString(), deviceUuid: "11111111-1111-4111-8111-111111111111", tenantUuid: "22222222-2222-4222-8222-222222222222", restaurantUuid: "33333333-3333-4333-8333-333333333333", token: "long-secure-token", configuration: {} } });
    expect(parsed.data.token).toBe("long-secure-token");
  });
});
