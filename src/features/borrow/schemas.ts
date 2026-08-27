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

export type AdminBorrowRequestsFilterInput = z.infer<typeof AdminBorrowRequestsFilterSchema>;
export type RejectBorrowRequestInput = z.infer<typeof RejectBorrowRequestSchema>;
