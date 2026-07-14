import { z } from "zod";
export const customerSearchSchema = z.object({ query: z.string().trim().max(100), limit: z.number().int().min(1).max(100).default(25) });
export const customerRefSchema = z.object({ customerUuid: z.string().uuid() });
export const saveCustomerSchema = z.object({
  customerUuid: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional().or(z.literal("")),
  addressSummary: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional()
});
