import Link from "next/link";
import {
  AdminCard,
  AdminEmptyState,
  AdminFilterPills,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";
import { getAuditLogsForAdmin } from "@/features/audit";
import { formatFullDateTime } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const ACTION_OPTIONS = [
  "All",
  "USER_ROLE_UPDATED",
  "USER_DELETED",
  "BORROW_STATUS_UPDATED",
] as const;

function getActionBadge(action: string | null) {
  switch (action) {
    case "USER_ROLE_UPDATED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-xs font-semibold text-purple-300">
          Role Updated
        </span>
      );
    case "USER_DELETED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
          Account Deleted
        </span>
      );
    case "BORROW_STATUS_UPDATED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300">
          Borrow Status
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white/70">
          {action || "Activity"}
        </span>
      );
  }
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; action?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const currentPage = Number(params.page) || 1;
  const currentAction = params.action || "All";

  const { data: logs, meta } = await getAuditLogsForAdmin({
    page: currentPage,
    action: currentAction,
    limit: 10,
  });

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Command Center"
        title="Audit Logs & Activity Trail"
        description="Review administrative changes, role updates, account removals, and equipment request logs."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
        <AdminFilterPills
          options={ACTION_OPTIONS}
          current={currentAction}
          buildHref={(option: string) => {
            const query = new URLSearchParams();
            if (option !== "All") query.set("action", option);
            query.set("page", "1");
            return `?${query.toString()}`;
          }}
        />

        <Link
          href={`/admin/audit-logs/export?action=${encodeURIComponent(currentAction)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F26223]/40 bg-[#F26223]/10 px-4 py-2 text-xs font-semibold text-[#FFB89A] shadow-sm transition hover:border-[#F26223] hover:bg-[#F26223] hover:text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>Download PDF Report</span>
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Actor</th>
              <th>Details / Changes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const state = (log.state_changes as Record<string, unknown>) ?? {};

              return (
                <tr key={log.id}>
                  <td className="text-xs text-white/50 whitespace-nowrap">
                    {formatFullDateTime(log.created_at)}
                  </td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <span className="text-xs font-semibold text-white">
                      {log.entity_type}
                    </span>
                    {log.entity_id && (
                      <p className="font-mono text-[10px] text-white/35 truncate max-w-[120px]">
                        {log.entity_id}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-white/70">
                      {log.Users?.email || "System Admin"}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-1 text-xs text-white/80">
                      {log.action === "USER_ROLE_UPDATED" && (
                        <p>
                          Changed role to{" "}
                          <strong className="text-emerald-300">
                            {String(state.newRole)}
                          </strong>{" "}
                          for <span className="text-white/60">{String(state.email)}</span>
                        </p>
                      )}
                      {log.action === "USER_DELETED" && (
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-red-300">
                            Permanently deleted user account
                          </p>
                          <p className="text-[11px] text-white/70">
                            Account: <strong className="text-white">{String(state.organization || "Personal Account")}</strong>
                          </p>
                          <p className="text-[11px] text-white/50">
                            Email: <span className="text-white/80">{String(state.email || "—")}</span>
                            {Boolean(state.role) && (
                              <span className="ml-2 text-white/40">
                                • Prior Role: <strong className="text-white/70">{String(state.role)}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {log.action === "BORROW_STATUS_UPDATED" && (
                        <div>
                          <p>
                            Status:{" "}
                            <span className="text-white/50">{String(state.oldStatus)}</span>{" "}
                            &rarr;{" "}
                            <strong className="text-orange-300">
                              {String(state.newStatus)}
                            </strong>
                          </p>
                          <p className="text-[11px] text-white/50 truncate max-w-sm">
                            Borrower: {String(state.borrower || "—")} | Items: {String(state.item || "—")}
                          </p>
                        </div>
                      )}
                      {!["USER_ROLE_UPDATED", "BORROW_STATUS_UPDATED", "USER_DELETED"].includes(log.action || "") && (
                        <pre className="font-mono text-[11px] text-white/60 max-w-sm overflow-x-auto">
                          {JSON.stringify(state, null, 2)}
                        </pre>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <AdminEmptyState>No activity logs recorded yet.</AdminEmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <p>
            Page {meta.page} of {meta.totalPages} ({meta.total} total log entries)
          </p>
          <div className="flex gap-2">
            {meta.page > 1 && (
              <Link
                href={`?page=${meta.page - 1}${currentAction !== "All" ? `&action=${currentAction}` : ""}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Previous
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link
                href={`?page=${meta.page + 1}${currentAction !== "All" ? `&action=${currentAction}` : ""}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
