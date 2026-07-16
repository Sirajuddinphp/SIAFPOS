import { z } from "zod";
const uuid = z.string().uuid();
export const activateLicenseSchema = z.object({
  licenseKey: z.string().trim().min(8).max(200),
  planCode: z.string().trim().min(1).max(40),
  maxOutlets: z.number().int().positive().max(10000),
  maxTerminals: z.number().int().positive().max(100000),
  expiresAt: z.string().datetime().nullish()
});
export const registerDeviceSchema = z.object({
  terminalUuid: uuid.nullish(),
  deviceName: z.string().trim().min(1).max(100),
  deviceFingerprint: z.string().trim().min(8).max(255),
  platform: z.string().trim().min(1).max(50),
  appVersion: z.string().trim().max(40).nullish()
});
export const enterpriseRefSchema = z.object({ uuid });
export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  scopes: z.array(z.string().trim().min(1).max(80)).max(50),
  expiresAt: z.string().datetime().nullish()
});
