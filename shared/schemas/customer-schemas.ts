import { z } from "zod";

export const customerSearchSchema = z.object({
  query: z.string().trim().max(100),
  limit: z.number().int().min(1).max(50).default(12)
});
