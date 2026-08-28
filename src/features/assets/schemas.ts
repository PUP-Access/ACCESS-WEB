import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
// SCHEMAS: Zod validation schemas for Asset CRUD operations
// ─────────────────────────────────────────────────────────────────────────

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long").toUpperCase(),
  category: z.string().trim().min(1, "Category is required").toUpperCase(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  unit: z.string().trim().max(20).optional().transform(v => v ? v.toUpperCase() : null),
  image_url: z.string().url("Must be a valid URL").optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  id: z.string().uuid("Invalid asset ID"),
});

export const deleteAssetSchema = z.object({
  id: z.string().uuid("Invalid asset ID"),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetSchema>;
