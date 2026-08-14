import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
// SCHEMAS: Zod validation schemas for Equipment CRUD operations
// ─────────────────────────────────────────────────────────────────────────

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").toUpperCase(),
  category: z.string().trim().min(1, "Category is required").toUpperCase(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  unit: z.string().trim().max(20).optional().transform(v => v ? v.toUpperCase() : null),
  image_url: z.string().url("Must be a valid URL").optional().nullable(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  id: z.string().uuid("Invalid equipment ID"),
});

export const deleteEquipmentSchema = z.object({
  id: z.string().uuid("Invalid equipment ID"),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type DeleteEquipmentInput = z.infer<typeof deleteEquipmentSchema>;
