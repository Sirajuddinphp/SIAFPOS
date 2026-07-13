import { z } from "zod";

export const passwordLoginSchema = z.object({
  restaurantCode: z.string().trim().min(1).max(32),
  outletCode: z.string().trim().min(1).max(32),
  terminalCode: z.string().trim().min(1).max(32),
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256),
  rememberTerminal: z.boolean()
});

export const pinLoginSchema = z.object({
  restaurantCode: z.string().trim().min(1).max(32),
  outletCode: z.string().trim().min(1).max(32),
  terminalCode: z.string().trim().min(1).max(32),
  pin: z.string().regex(/^[0-9]{4,12}$/),
  rememberTerminal: z.boolean()
});

export type PasswordLoginSchema = z.infer<typeof passwordLoginSchema>;
export type PinLoginSchema = z.infer<typeof pinLoginSchema>;
