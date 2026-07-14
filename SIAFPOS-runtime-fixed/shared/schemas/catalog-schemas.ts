import { z } from "zod";

export const productSearchSchema = z.object({
  categoryUuid: z.string().uuid().optional(),
  query: z.string().trim().max(100).optional(),
  exactBarcode: z.string().trim().max(64).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(200).default(60)
});

export const productRefSchema = z.object({
  productUuid: z.string().uuid()
});
