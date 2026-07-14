import { z } from "zod";
const uuid=z.string().uuid();
export const saveInventoryItemSchema=z.object({itemUuid:uuid.optional(),name:z.string().trim().min(2).max(120),sku:z.string().trim().max(60).optional().default(""),unit:z.string().trim().min(1).max(20),reorderLevel:z.number().min(0),costPerUnitMinor:z.number().int().min(0),openingQty:z.number().min(0).optional(),isActive:z.boolean().optional()});
export const stockAdjustmentSchema=z.object({itemUuid:uuid,qtyDelta:z.number().refine(v=>v!==0),type:z.enum(["wastage","adjustment","return"]),notes:z.string().trim().max(250).optional()});
export const saveSupplierSchema=z.object({supplierUuid:uuid.optional(),name:z.string().trim().min(2).max(120),phone:z.string().trim().max(30).optional(),email:z.union([z.string().trim().email(),z.literal("")]).optional(),address:z.string().trim().max(300).optional(),isActive:z.boolean().optional()});
export const saveRecipeSchema=z.object({recipeUuid:uuid.optional(),productUuid:uuid,yieldQty:z.number().positive(),notes:z.string().trim().max(300).optional(),items:z.array(z.object({inventoryItemUuid:uuid,qty:z.number().positive()})).min(1)});
export const createPurchaseSchema=z.object({supplierUuid:uuid.optional(),invoiceNo:z.string().trim().max(80).optional(),notes:z.string().trim().max(300).optional(),purchasedAt:z.string().datetime(),items:z.array(z.object({inventoryItemUuid:uuid,qty:z.number().positive(),unitCostMinor:z.number().int().min(0)})).min(1)});
export const purchaseRefSchema=z.object({purchaseUuid:uuid});
