import Link from "next/link";
import {
  AdminFilterPills,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";
import { getUserStats, getUsersForAdmin } from "@/features/users";
import UsersRealtimeTable from "./components/UsersRealtimeTable";
import UserSearchBar from "./components/UserSearchBar";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS = [
  "All",
  "Pending",
  "Organization",
  "Admin",
  "Tech",
  "SponsorsPartners",
  "Govs",
] as const;

function UserStatCard({
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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; role?: string; search?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const currentPage = Number(params.page) || 1;
  const currentRole = params.role || "All";
  const currentSearch = params.search || "";

  const [stats, { data: users, meta }] = await Promise.all([
    getUserStats(),
    getUsersForAdmin({
      page: currentPage,
      role: currentRole,
      search: currentSearch,
      limit: 15,
    }),
  ]);

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Command Center"
        title="User Accounts & Roles"
        description="Manage registered organization accounts and grant equipment borrowing eligibility in real-time."
      />

      {/* Summary Metrics Cards (Matching Dashboard StatCard Style) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UserStatCard
          label="Total Accounts"
          value={stats.total}
          href="/admin/users"
          accent="#F26223"
        />
        <UserStatCard
          label="Pending Approvals"
          value={stats.pending}
          href="/admin/users?role=Pending"
          accent="#FFB800"
        />
        <UserStatCard
          label="Eligible Orgs"
          value={stats.organization}
          href="/admin/users?role=Organization"
          accent="#10B981"
        />
        <UserStatCard
          label="Administrators"
          value={stats.admin}
          href="/admin/users?role=Admin"
          accent="#FF8C00"
        />
      </section>

      {/* Controls Bar: Search + Filter Pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <AdminFilterPills
          options={ROLE_OPTIONS}
          current={currentRole}
          buildHref={(option: string) => {
            const query = new URLSearchParams();
            if (option !== "All") query.set("role", option);
            if (currentSearch) query.set("search", currentSearch);
            query.set("page", "1");
            return `?${query.toString()}`;
          }}
        />

        <UserSearchBar initialSearch={currentSearch} />
      </div>

      {/* Realtime User Table */}
      <UsersRealtimeTable
        initialUsers={users}
        currentRoleFilter={currentRole}
      />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <p>
            Page {meta.page} of {meta.totalPages} ({meta.total} total accounts)
          </p>
          <div className="flex gap-2">
            {meta.page > 1 && (
              <Link
                href={`?page=${meta.page - 1}&role=${currentRole}${
                  currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""
                }`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Previous
              </Link>
            )}
            {meta.page < meta.totalPages && (
              <Link
                href={`?page=${meta.page + 1}&role=${currentRole}${
                  currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""
                }`}
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
