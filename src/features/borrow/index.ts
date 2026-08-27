export {
  getBorrowRequestsForAdmin,
  getBorrowRequestById,
  getPendingBorrowRequestCount,
  getRecentBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  releaseBorrowRequest,
  returnBorrowRequest,
  resolveBorrowRequestLetterUrl,
} from "./services/borrow-requests.admin.service";

export { sendBorrowStatusEmail } from "./services/borrow-status-email";

export { adjustEquipmentQuantities, parseRequestedItems } from "./utils/requested-items";

export {
  approveBorrowRequestAction,
  rejectBorrowRequestAction,
  releaseBorrowRequestAction,
  returnBorrowRequestAction,
  getBorrowRequestLetterUrlAction,
} from "./actions/borrow-requests.actions";

export type { BorrowRequest, BorrowRequestsFilter, ResolvedLetter } from "./services/borrow-requests.admin.service";
export type { ParsedRequestedItem } from "./utils/requested-items";

export * from "./schemas";
