import { z } from "zod";
const uuid=z.string().uuid();
export const saveOutletSchema=z.object({outletUuid:uuid.optional(),name:z.string().trim().min(2).max(100),code:z.string().trim().min(1).max(30),address:z.string().trim().max(300).optional(),city:z.string().trim().max(80).optional(),state:z.string().trim().max(80).optional(),postalCode:z.string().trim().max(20).optional(),phone:z.string().trim().max(30).optional(),status:z.enum(["active","inactive"]).optional()});
export const createStockTransferSchema=z.object({fromOutletUuid:uuid,toOutletUuid:uuid,notes:z.string().trim().max(300).optional(),items:z.array(z.object({inventoryItemUuid:uuid,qty:z.number().positive()})).min(1)}).refine(v=>v.fromOutletUuid!==v.toOutletUuid,{message:"Source and destination outlets must be different."});
export const transferRefSchema=z.object({transferUuid:uuid});
