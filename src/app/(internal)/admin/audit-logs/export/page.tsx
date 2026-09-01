import { redirect } from "next/navigation";
import Image from "next/image";
import { checkRole } from "@/utils/checkRole";
import { rolesForArea } from "@/utils/adminAccess";
import { getAuditLogsForAdmin } from "@/features/audit";
import { formatFullDateTime } from "@/lib/date-utils";
import AuditExportToolbar from "./AuditExportToolbar";

export const dynamic = "force-dynamic";

function getPrintActionBadge(action: string | null) {
  switch (action) {
    case "USER_ROLE_UPDATED":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            backgroundColor: "#F5F3FF",
            color: "#6D28D9",
            border: "1px solid #DDD6FE",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          Role Updated
        </span>
      );
    case "USER_DELETED":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            backgroundColor: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          Account Deleted
        </span>
      );
    case "BORROW_STATUS_UPDATED":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            backgroundColor: "#ECFEFF",
            color: "#0E7490",
            border: "1px solid #CFFAFE",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          Borrow Status
        </span>
      );
    default:
      return (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            backgroundColor: "#F3F4F6",
            color: "#374151",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          {action || "Activity"}
        </span>
      );
  }
}

export default async function AuditLogsExportPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string }>;
}) {
  await checkRole({ roles: rolesForArea("audit-logs") });

  const params = (await searchParams) ?? {};
  const currentAction = params.action || "All";

  const { data: logs, meta } = await getAuditLogsForAdmin({
    page: 1,
    action: currentAction,
    limit: 200,
  });

  const generatedDate = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#121212] print:bg-white text-gray-800 print:text-black py-0 sm:py-8 print:py-0 font-sans antialiased">
      {/* Client Toolbar for Screen View */}
      <AuditExportToolbar filterAction={currentAction} totalCount={meta.total} />

      {/* Printable Institutional Document Shell (Matching Email Template) */}
      <div className="mx-auto max-w-[850px] bg-white print:max-w-none print:w-full print:shadow-none shadow-2xl rounded-none sm:rounded-lg overflow-hidden border border-gray-200 print:border-none print:m-0 print:p-0">
        
        {/* Top 3px Institutional Accent Line */}
        <div style={{ height: "4px", backgroundColor: "#F26223" }} />

        <div className="p-8 sm:p-10 print:p-4">
          
          {/* Header & Emblem */}
          <header className="border-b border-gray-200 pb-6">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 flex-shrink-0">
                <Image
                  src="/circle-access-logo.webp"
                  alt="PUP ACCESS Seal"
                  width={56}
                  height={56}
                  priority
                  className="rounded-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                  PUP ACCESS
                </h1>
                <p className="text-xs text-gray-600 leading-normal">
                  Association of Concerned Computer Engineering Students for Service
                  <br />
                  Polytechnic University of the Philippines – Manila
                </p>
              </div>
            </div>
          </header>

          {/* Report Title & Metadata Banner */}
          <section aria-labelledby="report-title" className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-block rounded bg-orange-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#F26223] border border-orange-200">
                  Official Administrative Record
                </span>
                <h2 id="report-title" className="mt-2 text-lg font-bold text-gray-900">
                  Audit Logs & Activity Trail Report
                </h2>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>
                  <strong>Generated On:</strong> {generatedDate}
                </p>
                <p>
                  <strong>Filter Scope:</strong> {currentAction === "All" ? "All Administrative Actions" : currentAction}
                </p>
                <p>
                  <strong>Total Records:</strong> {meta.total} {meta.total > 200 ? "(Displaying top 200)" : "entries"}
                </p>
              </div>
            </div>
          </section>

          {/* Metadata Summary Grid */}
          <section aria-label="Report Metadata" className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4 text-xs">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <span className="text-gray-500 font-medium">Document ID:</span>
                <p className="font-mono font-semibold text-gray-800">
                  AUD-{Date.now().toString().slice(-8)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Classification:</span>
                <p className="font-semibold text-gray-800">Internal Audit & Operations</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Issuing System:</span>
                <p className="font-semibold text-[#F26223]">PUP ACCESS Portal</p>
              </div>
            </div>
          </section>

          {/* Logs Table */}
          <section aria-label="Audit Log Entries" className="mt-6">
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/80 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Details / Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log, idx) => {
                    const state = (log.state_changes as Record<string, unknown>) ?? {};

                    return (
                      <tr
                        key={log.id}
                        className={`break-inside-avoid ${
                          idx % 2 === 1 ? "bg-gray-50/60" : "bg-white"
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap font-mono text-[11px] align-top">
                          {formatFullDateTime(log.created_at)}
                        </td>

                        {/* Action Badge */}
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          {getPrintActionBadge(log.action)}
                        </td>

                        {/* Entity */}
                        <td className="py-2.5 px-3 align-top">
                          <span className="font-semibold text-gray-900 block">
                            {log.entity_type}
                          </span>
                          {log.entity_id && (
                            <span className="font-mono text-[10px] text-gray-400 block truncate max-w-[90px]">
                              {log.entity_id}
                            </span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-2.5 px-3 align-top text-gray-700">
                          <span className="block font-medium">
                            {log.Users?.email || "System Admin"}
                          </span>
                        </td>

                        {/* Details / State Changes */}
                        <td className="py-2.5 px-3 align-top text-gray-800">
                          {log.action === "USER_ROLE_UPDATED" && (
                            <div className="text-xs">
                              Changed role to{" "}
                              <strong className="text-purple-700">
                                {String(state.newRole)}
                              </strong>{" "}
                              for <span className="text-gray-600">{String(state.email)}</span>
                            </div>
                          )}

                          {log.action === "USER_DELETED" && (
                            <div className="space-y-0.5 text-xs">
                              <p className="font-bold text-red-700">
                                Permanently deleted user account
                              </p>
                              <p className="text-gray-600 text-[11px]">
                                Account: <strong>{String(state.organization || "Personal Account")}</strong> ({String(state.email || "—")})
                              </p>
                              {Boolean(state.role) && (
                                <p className="text-gray-500 text-[10px]">
                                  Prior Role: <strong>{String(state.role)}</strong>
                                </p>
                              )}
                            </div>
                          )}

                          {log.action === "BORROW_STATUS_UPDATED" && (
                            <div className="space-y-0.5 text-xs">
                              <p>
                                Status:{" "}
                                <span className="text-gray-500 line-through mr-1">
                                  {String(state.oldStatus)}
                                </span>
                                &rarr;{" "}
                                <strong className="text-[#F26223]">
                                  {String(state.newStatus)}
                                </strong>
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Borrower: {String(state.borrower || "—")} | Item: {String(state.item || "—")}
                              </p>
                            </div>
                          )}

                          {!["USER_ROLE_UPDATED", "BORROW_STATUS_UPDATED", "USER_DELETED"].includes(
                            log.action || ""
                          ) && (
                            <pre className="font-mono text-[10px] text-gray-600 max-w-xs overflow-hidden">
                              {JSON.stringify(state, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No activity records found matching the requested criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Document Sign-off */}
          <footer className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-800">In best service,</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">PUP ACCESS</p>
                <p className="text-[11px] text-gray-500 mt-2">
                  Room 424, College of Engineering and Architecture (CEA) Building
                  <br />
                  Pureza St., Sta. Mesa, Manila, Philippines
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="font-mono text-[11px]">Official Portal: <strong>pupaccess.org</strong></p>
                <p className="text-[10px] text-gray-400 mt-1">End of Audit Record • Verified by PUP ACCESS Operations</p>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
          }
        `
      }} />
    </div>
  );
}
