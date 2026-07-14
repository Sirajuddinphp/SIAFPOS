import { z } from "zod";
export const reportRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
}).refine((value) => new Date(value.from).getTime() <= new Date(value.to).getTime(), {
  message: "From date must be before to date."
});
