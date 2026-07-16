import { z } from "zod";

export const activateDeviceSchema = z.object({
  restaurantCode: z.string().trim().min(2).max(64),
  licenseKey: z.string().trim().min(6).max(255),
  ownerEmail: z.string().trim().email(),
  ownerMobile: z.string().trim().min(7).max(20)
});

export const cloudActivationResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    activatedAt: z.string().min(1),
    deviceUuid: z.string().uuid(),
    tenantUuid: z.string().uuid(),
    restaurantUuid: z.string().uuid(),
    token: z.string().min(10),
    configuration: z.object({
      restaurantName: z.string().optional(),
      planCode: z.string().optional(),
      expiresAt: z.string().nullable().optional(),
      features: z.record(z.boolean()).optional(),
      limits: z.record(z.number()).optional()
    }).passthrough().default({})
  })
});
