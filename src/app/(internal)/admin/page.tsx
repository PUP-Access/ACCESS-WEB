import Link from "next/link";
import { getAdminDashboardStats } from "@/features/cms";
import { AdminPageHeader, AdminPageShell } from "./components/admin-ui";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="admin-card group relative overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
        style={{ background: accent }}
      />
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="title-header mt-3 text-4xl font-extrabold">{value}</p>
      <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
        Open →
      </p>
    </Link>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

const QUICK_ACTIONS = [
  { href: "/admin/users", label: "Manage user accounts & roles", tag: "Accounts" },
  { href: "/admin/content/landing", label: "Edit landing hero", tag: "Content" },
  { href: "/admin/content/about", label: "Update about us", tag: "Content" },
  { href: "/admin/events/new", label: "Create new event", tag: "Events" },
  { href: "/admin/content/faqs", label: "Manage FAQs", tag: "Content" },
  { href: "/admin/borrow-requests", label: "Review borrow queue", tag: "Inbox" },
  { href: "/admin/contact-messages", label: "Read contact inbox", tag: "Inbox" },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Command Center"
        title="Dashboard"
        description="Manage landing content, events, borrow requests, and contact messages from one place."
      />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending borrows"
            value={stats.pendingBorrowRequests}
            href="/admin/borrow-requests"
            accent="#F26223"
          />
          <StatCard
            label="Unread messages"
            value={stats.unreadContactMessages}
            href="/admin/contact-messages"
            accent="#FFB800"
          />
          <StatCard
            label="Draft events"
            value={stats.draftEvents}
            href="/admin/events?status=Draft"
            accent="#862520"
          />
          <StatCard
            label="Active FAQs"
            value={stats.faqCount}
            href="/admin/content/faqs"
            accent="#FF8C00"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="admin-card rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white">Quick actions</h3>
            <p className="mt-1 text-xs text-white/40">Jump straight into common admin tasks.</p>
            <ul className="mt-5 space-y-2">
              {QUICK_ACTIONS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm transition hover:border-[#F26223]/30 hover:bg-[#F26223]/10 min-w-0"
                  >
                    <span className="text-white/85 truncate min-w-0">{link.label}</span>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/35">
                      {link.tag}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card rounded-2xl p-6 lg:col-span-3 min-w-0">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent borrow requests</h3>
                <p className="text-xs text-white/40">Latest submissions from the public site.</p>
              </div>
              <Link
                href="/admin/borrow-requests"
                className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[#FFB89A] transition hover:text-[#FFD4BC]"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentBorrowRequests.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40">
                  No borrow requests yet.
                </p>
              ) : (
                stats.recentBorrowRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-white/8 bg-black/25 px-4 py-3 min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <p
                        className="text-sm font-semibold text-white truncate min-w-0"
                        title={request.borrower_contact_name ?? "Unknown borrower"}
                      >
                        {request.borrower_contact_name ?? "Unknown borrower"}
                      </p>
                      <span className="shrink-0 rounded-full bg-[#F26223]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFB89A]">
                        {request.status ?? "Pending"}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-xs text-white/45 truncate min-w-0"
                      title={request.requested_item ?? "No item listed"}
                    >
                      {request.requested_item ?? "No item listed"}
                    </p>
                    <p className="mt-2 text-[11px] text-white/30">{formatDate(request.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="admin-card rounded-2xl p-6 min-w-0">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Recent contact messages</h3>
              <p className="text-xs text-white/40">Inquiries from the Contact Us form.</p>
            </div>
            <Link
              href="/admin/contact-messages"
              className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[#FFB89A] transition hover:text-[#FFD4BC]"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 min-w-0">
            {stats.recentContactMessages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/40 md:col-span-2">
                No contact messages yet.
              </p>
            ) : (
              stats.recentContactMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-white/8 bg-black/25 px-4 py-3 min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <p
                      className="text-sm font-semibold text-white truncate min-w-0"
                      title={message.full_name}
                    >
                      {message.full_name}
                    </p>
                    {!message.is_read ? (
                      <span className="shrink-0 rounded-full bg-[#FFB800]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FFD56B]">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="text-xs text-white/45 truncate min-w-0"
                    title={message.email}
                  >
                    {message.email}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-white/65 break-words">{message.concern}</p>
                  <p className="mt-2 text-[11px] text-white/30">{formatDate(message.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </section>
    </AdminPageShell>
  );
}
