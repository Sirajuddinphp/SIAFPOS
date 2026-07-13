import type { ZodSchema } from "zod";

export function validateIpcInput<T>(schema: ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
