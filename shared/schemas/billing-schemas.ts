import { z } from "zod";

export const openShiftSchema = z.object({ openingCashMinor: z.number().int().min(0) });
export const closeShiftSchema = z.object({ actualCashMinor: z.number().int().min(0), closingNote: z.string().trim().max(500).optional() });
export const billOrderRefSchema = z.object({ orderUuid: z.string().uuid() });
export const billRefSchema = z.object({ billUuid: z.string().uuid() });
export const paymentInputSchema = z.object({
  mode: z.enum(["cash", "upi", "card", "credit", "custom"]),
  amountMinor: z.number().int().positive(),
  reference: z.string().trim().max(120).optional(),
  receivedMinor: z.number().int().positive().optional()
});
export const settleBillSchema = z.object({ orderUuid: z.string().uuid(), payments: z.array(paymentInputSchema).min(1).max(10) });
