import { z } from "zod";

export const configureSyncSchema = z.object({
  apiUrl: z.string().trim().url().max(500),
  apiToken: z.string().trim().max(2000).optional()
});
