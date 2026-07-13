import { z } from "zod";

export const kotOrderRefSchema = z.object({
  orderUuid: z.string().uuid()
});

export const kotRefSchema = z.object({
  kotUuid: z.string().uuid()
});

export const cancelKotSchema = z.object({
  kotUuid: z.string().uuid(),
  reason: z.string().trim().max(280).optional()
});
