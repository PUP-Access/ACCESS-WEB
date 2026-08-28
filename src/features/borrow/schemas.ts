import { z } from "zod";

export const BorrowRequestIdSchema = z.uuid({ message: "Invalid borrow request ID" });

export const AdminBorrowRequestsFilterSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected", "Active", "Returned", "Cancelled", "All"]).default("Pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
}).strict();

export const RejectBorrowRequestSchema = z.object({
  reason: z.string().trim().min(5, "Please provide a reason (at least 5 characters)").max(1000),
}).strict();

const BorrowRequestItemsJsonSchema = z
  .string()
  .transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({ code: "custom", message: "Malformed items payload." });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(
        z.object({
          assetId: z.uuid({ message: "Invalid asset id" }),
          quantity: z.number().int().min(1, "Quantity must be at least 1"),
        })
      )
      .min(1, "Please add at least one item to borrow.")
  );

export const SubmitBorrowRequestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  courseYearSection: z.string().min(1),
  contactNumber: z.string().min(1),
  organization: z.string().min(1),
  purpose: z.string().min(1),
  additionalInfo: z.string().optional(),
  items: BorrowRequestItemsJsonSchema,
  startDate: z.string().min(1),
  startHour: z.string().min(1),
  startMinute: z.string().min(1),
  startPeriod: z.enum(["AM", "PM"]),
  endDate: z.string().min(1),
  endHour: z.string().min(1),
  endMinute: z.string().min(1),
  endPeriod: z.enum(["AM", "PM"]),
});

export type AdminBorrowRequestsFilterInput = z.infer<typeof AdminBorrowRequestsFilterSchema>;
export type RejectBorrowRequestInput = z.infer<typeof RejectBorrowRequestSchema>;
export type SubmitBorrowRequestInput = z.infer<typeof SubmitBorrowRequestSchema>;
