import { z } from "zod";
export const adjustLoyaltySchema = z.object({
  customerUuid: z.string().uuid(),
  transactionType: z.enum(["points","wallet"]),
  direction: z.enum(["credit","debit"]),
  amount: z.number().int().positive(),
  reason: z.string().trim().min(2).max(240)
});
export const saveCouponSchema = z.object({
  couponUuid: z.string().uuid().optional(), code:z.string().trim().min(2).max(30).transform(v=>v.toUpperCase()),
  name:z.string().trim().min(2).max(120), discountType:z.enum(["fixed","percentage"]), discountValue:z.number().int().positive(),
  minOrderMinor:z.number().int().min(0).optional(), maxDiscountMinor:z.number().int().positive().nullable().optional(),
  startsAt:z.string().datetime().nullable().optional(), endsAt:z.string().datetime().nullable().optional(), usageLimit:z.number().int().positive().nullable().optional(), isActive:z.boolean().optional()
});
export const saveMembershipSchema = z.object({
  membershipUuid:z.string().uuid().optional(), customerUuid:z.string().uuid(), planName:z.string().trim().min(2).max(100),
  startsAt:z.string().datetime(), endsAt:z.string().datetime(), status:z.enum(["active","expired","cancelled"]).optional()
});
