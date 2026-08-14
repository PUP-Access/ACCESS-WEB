/**
 * Helper to reliably parse UTC timestamp strings from Supabase/PostgreSQL.
 * If the string lacks timezone metadata (e.g. "2026-08-11T15:09:00"),
 * it guarantees it is parsed as UTC so the user's browser converts it to local time (e.g. UTC+8).
 */
export function parseUtcDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  let str = String(dateStr).trim();
  if (!str) return null;

  // Handle SQL format "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  if (str.includes(" ") && !str.includes("T")) {
    str = str.replace(" ", "T");
  }

  // If it's a date-time string without timezone identifier (Z or +/-offset), append Z for UTC
  if (str.includes("T") && !str.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date into a clean, localized string (e.g. "Aug 11, 2026, 11:09 PM").
 */
export function formatFullDateTime(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  if (!d) return "—";

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a date into relative + full string.
 */
export function formatRelativeDateTime(dateStr: string | null | undefined): {
  relative: string;
  full: string;
} {
  const date = parseUtcDate(dateStr);
  if (!date) return { relative: "—", full: "—" };

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let relative = "";
  if (diffMs < 0 || diffHours < 1) {
    const mins = Math.max(1, Math.floor(Math.abs(diffMs) / (1000 * 60)));
    relative = `${mins}m ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    relative = "Yesterday";
  } else if (diffDays < 7) {
    relative = `${diffDays}d ago`;
  } else {
    relative = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const full = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { relative, full };
}
