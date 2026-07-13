import { z } from "zod";

export const orderTypeSchema = z.enum(["dine_in", "takeaway", "delivery"]);
export const discountTypeSchema = z.enum(["fixed", "percentage"]);

export const createOrderDraftSchema = z.object({
  orderType: orderTypeSchema
});

export const orderRefSchema = z.object({
  orderUuid: z.string().uuid()
});

export const addOrderItemSchema = z.object({
  orderUuid: z.string().uuid(),
  productUuid: z.string().uuid(),
  variantUuid: z.string().uuid().optional()
});

export const updateOrderItemQuantitySchema = z.object({
  orderUuid: z.string().uuid(),
  orderItemUuid: z.string().uuid(),
  quantity: z.number().int().min(0).max(999)
});

export const removeOrderItemSchema = z.object({
  orderUuid: z.string().uuid(),
  orderItemUuid: z.string().uuid()
});

export const setOrderItemVariantSchema = z.object({
  orderUuid: z.string().uuid(),
  orderItemUuid: z.string().uuid(),
  variantUuid: z.string().uuid()
});

export const setOrderItemModifiersSchema = z.object({
  orderUuid: z.string().uuid(),
  orderItemUuid: z.string().uuid(),
  modifierUuids: z.array(z.string().uuid()).max(20)
});

export const setOrderItemNoteSchema = z.object({
  orderUuid: z.string().uuid(),
  orderItemUuid: z.string().uuid(),
  kitchenNote: z.string().trim().max(280)
});

export const setOrderCustomerSchema = z.object({
  orderUuid: z.string().uuid(),
  customerUuid: z.string().uuid().nullable()
});

export const setOrderTypeSchema = z.object({
  orderUuid: z.string().uuid(),
  orderType: orderTypeSchema
});

export const setOrderTableSchema = z.object({
  orderUuid: z.string().uuid(),
  tableUuid: z.string().uuid().nullable()
});

export const setOrderWaiterSchema = z.object({
  orderUuid: z.string().uuid(),
  waiterUuid: z.string().uuid().nullable()
});

export const applyOrderDiscountSchema = z.object({
  orderUuid: z.string().uuid(),
  type: discountTypeSchema,
  value: z.number().nonnegative().max(1000000)
});
