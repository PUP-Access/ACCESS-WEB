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
  detectAndLogOverdueBorrowRequests,
} from "./services/borrow-requests.admin.service";

export { sendBorrowStatusEmail } from "./services/borrow-status-email";

export { drainStorageCleanupQueue } from "./services/storage-cleanup.service";

export {
  buildRequestedItemDisplayString,
  adjustAssetQuantities,
  getBorrowRequestItemsWithAssets,
} from "./utils/asset-quantities";

export {
  isWithinOperatingHours,
  isSunday,
  rangesOverlap,
  getUnavailablePeriods,
  checkAssetAvailability,
  checkItemsAvailability,
  OPERATING_HOURS_LABEL,
} from "./utils/asset-availability";
export type { UnavailablePeriod, AvailabilityResult, ItemAvailabilityResult } from "./utils/asset-availability";

export {
  approveBorrowRequestAction,
  rejectBorrowRequestAction,
  releaseBorrowRequestAction,
  returnBorrowRequestAction,
  getBorrowRequestLetterUrlAction,
} from "./actions/borrow-requests.actions";

export type { BorrowRequest, BorrowRequestsFilter, ResolvedLetter } from "./services/borrow-requests.admin.service";
export type { AssetQuantityItem, ResolvedRequestedItem } from "./utils/asset-quantities";

export * from "./schemas";
