import { z } from "zod";
export const printerRefSchema=z.object({printerUuid:z.string().uuid()});
export const printJobRefSchema=z.object({printJobUuid:z.string().uuid()});
export const queueKotPrintSchema=z.object({kotUuid:z.string().uuid(),printerUuid:z.string().uuid().optional()});
export const savePrinterSchema=z.object({
 uuid:z.string().uuid().optional(),name:z.string().trim().min(1).max(80),role:z.enum(["receipt","kitchen","bar","cashier"]),
 connectionType:z.enum(["mock","lan","usb"]),host:z.string().trim().max(255).nullable(),port:z.number().int().min(1).max(65535).nullable(),
 devicePath:z.string().trim().max(500).nullable(),paperWidthMm:z.union([z.literal(58),z.literal(80)]),charactersPerLine:z.number().int().min(24).max(64),
 autoCut:z.boolean(),openCashDrawer:z.boolean(),isDefault:z.boolean(),isActive:z.boolean()
}).superRefine((v,ctx)=>{if(v.connectionType==="lan"&&!v.host)ctx.addIssue({code:"custom",path:["host"],message:"LAN host is required."});if(v.connectionType==="usb"&&!v.devicePath)ctx.addIssue({code:"custom",path:["devicePath"],message:"USB/shared printer device path is required."});});
export const savePrinterRouteSchema=z.object({uuid:z.string().uuid().optional(),documentType:z.enum(["receipt","kot"]),categoryUuid:z.string().uuid().nullable(),printerUuid:z.string().uuid(),priority:z.number().int().min(0).max(999)});
