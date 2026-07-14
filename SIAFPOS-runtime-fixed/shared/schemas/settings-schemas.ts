import { z } from "zod";

export const settingsGetSchema = z.object({
  key: z.string().trim().min(1).max(128)
});

export const settingsSetSchema = z.object({
  key: z.string().trim().min(1).max(128),
  value: z.string().max(10000),
  type: z.enum(["string", "number", "boolean", "json"]),
  isSecure: z.boolean().optional()
});
