import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
// SCHEMAS: Zod validation schemas for Officer CRUD operations
// Purpose: Ensure data integrity before it hits the database
// ─────────────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Base schema fields that are reusable
const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must not exceed 100 characters")
  .transform((val) => toTitleCase(val));

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Please enter a valid email address" }));

const positionTitleSchema = z
  .string()
  .trim()
  .min(2, "Position title must be at least 2 characters")
  .max(80, "Position title must not exceed 80 characters")
  .transform((val) => toTitleCase(val));

const departmentSchema = z
  .string()
  .trim()
  .min(2, "Department must be at least 2 characters")
  .max(100, "Department must not exceed 100 characters")
  .transform((val) => toTitleCase(val));

const academicYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g., 2025-2026)");

const imageUrlSchema = z
  .string()
  .url("Image URL must be a valid URL")
  .optional()
  .or(z.literal(""));

// ─────────────────────────────────────────────────────────────────────────
// CREATE OFFICER SCHEMA
// ─────────────────────────────────────────────────────────────────────────
export const CreateOfficerSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  position_title: positionTitleSchema,
  department: departmentSchema,
  academic_year: academicYearSchema,
  image_url: imageUrlSchema,
  is_active: z.coerce.boolean().default(true),
  display_order: z.coerce.number().int().min(0).optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// UPDATE OFFICER SCHEMA
// ─────────────────────────────────────────────────────────────────────────
export const UpdateOfficerSchema = z
  .object({
    full_name: fullNameSchema.optional(),
    email: emailSchema.optional(),
    position_title: positionTitleSchema.optional(),
    department: departmentSchema.optional(),
    academic_year: academicYearSchema.optional(),
    image_url: imageUrlSchema.optional(),
    is_active: z.coerce.boolean().optional(),
    display_order: z.coerce.number().int().min(0).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────
// REORDER OFFICERS SCHEMA
// ─────────────────────────────────────────────────────────────────────────
export const ReorderOfficersSchema = z.object({
  officers: z
    .array(
      z.object({
        id: z.string().uuid("Invalid officer ID"),
        display_order: z.number().int().min(0),
      })
    )
    .min(1, "At least one officer must be provided"),
});

// ─────────────────────────────────────────────────────────────────────────
// OFFICER HIERARCHY ITEM SCHEMA (For visual hierarchy cards and modal)
// ─────────────────────────────────────────────────────────────────────────
export const OfficerHierarchyItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().optional().default(""),
  role: z.string().min(1, "Role is required"),
  tierId: z.string().min(1, "Tier is required"),
  courseYear: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  email: z.string().optional().default(""),
  facebookUrl: z.string().optional().default(""),
  linkedinUrl: z.string().optional().default(""),
  githubUrl: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
});

export const OfficersHierarchyContentSchema = z.object({
  tiers: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      officers: z.array(OfficerHierarchyItemSchema),
    })
  ),
  advisers: z.array(OfficerHierarchyItemSchema),
});

// ─────────────────────────────────────────────────────────────────────────
// CLASS REPRESENTATIVES SCHEMAS
// ─────────────────────────────────────────────────────────────────────────
export const ClassRepItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().optional().default(""),
  role: z.string().optional().default("CLASS REPRESENTATIVE"),
  yearId: z.string().min(1, "Year level is required"),
  section: z.string().min(1, "Section is required"),
  courseYear: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  email: z.string().optional().default(""),
  facebookUrl: z.string().optional().default(""),
  linkedinUrl: z.string().optional().default(""),
  githubUrl: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
});

export const ClassRepsContentSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    yearNumber: z.string(),
    description: z.string(),
    sealUrl: z.string().optional(),
    representatives: z.array(ClassRepItemSchema),
  })
);

// ─────────────────────────────────────────────────────────────────────────
// BATCH REPRESENTATIVES SCHEMAS
// ─────────────────────────────────────────────────────────────────────────
export const BatchRepItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().optional().default(""),
  role: z.string().optional().default("BATCH REPRESENTATIVE"),
  batchId: z.string().min(1, "Batch is required"),
  batchYear: z.string().optional().default(""),
  courseYear: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  email: z.string().optional().default(""),
  facebookUrl: z.string().optional().default(""),
  linkedinUrl: z.string().optional().default(""),
  githubUrl: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
});

export const BatchRepsContentSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    batchNumber: z.string(),
    description: z.string(),
    sealUrl: z.string().optional(),
    representatives: z.array(BatchRepItemSchema),
  })
);

export type CreateOfficerInput = z.infer<typeof CreateOfficerSchema>;
export type UpdateOfficerInput = z.infer<typeof UpdateOfficerSchema>;
export type ReorderOfficersInput = z.infer<typeof ReorderOfficersSchema>;
export type OfficerHierarchyItemInput = z.infer<typeof OfficerHierarchyItemSchema>;
export type OfficersHierarchyContent = z.infer<typeof OfficersHierarchyContentSchema>;
export type ClassRepItemInput = z.infer<typeof ClassRepItemSchema>;
export type ClassRepsContent = z.infer<typeof ClassRepsContentSchema>;
export type BatchRepItemInput = z.infer<typeof BatchRepItemSchema>;
export type BatchRepsContent = z.infer<typeof BatchRepsContentSchema>;
