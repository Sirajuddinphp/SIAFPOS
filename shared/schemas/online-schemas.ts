import { z } from "zod";
export const saveOnlineChannelSchema=z.object({channelUuid:z.string().uuid().optional(),name:z.string().trim().min(2).max(100),channelType:z.enum(["qr","website","mealhi5","custom"]),isActive:z.boolean().optional(),autoAccept:z.boolean().optional()});
export const generateQrTokenSchema=z.object({tableUuid:z.string().uuid()});
export const updateOnlineOrderStatusSchema=z.object({orderUuid:z.string().uuid(),status:z.enum(["pending","accepted","preparing","ready","completed","rejected","cancelled"])});
export const createOnlineOrderSchema=z.object({
  channelUuid:z.string().uuid().nullable().optional(),externalOrderId:z.string().trim().max(100).nullable().optional(),orderType:z.enum(["dine_in","takeaway","delivery"]),customerName:z.string().trim().min(2).max(120),customerPhone:z.string().trim().max(30).nullable().optional(),addressSummary:z.string().trim().max(500).nullable().optional(),tableUuid:z.string().uuid().nullable().optional(),notes:z.string().trim().max(500).nullable().optional(),paymentStatus:z.enum(["unpaid","paid","cod"]).optional(),items:z.array(z.object({productUuid:z.string().uuid().nullable().optional(),itemName:z.string().trim().min(1).max(160),qty:z.number().int().positive(),unitPriceMinor:z.number().int().min(0),note:z.string().trim().max(300).nullable().optional()})).min(1)
});
