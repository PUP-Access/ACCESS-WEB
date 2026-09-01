import { signOut } from "@/features/auth/actions/auth.actions";
import { requireAdmin } from "@/utils/requireAdmin";
import { getRecentNotifications } from "@/features/notifications";
import AdminSidebar from "./components/AdminSidebar";
import NotificationBell from "./components/NotificationBell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const notifications = await getRecentNotifications(20).catch(() => []);

  return (
    <div className="admin-shell relative flex min-h-screen bg-[#120808] text-white print:bg-white print:text-black print:block print:min-h-0">
      <div
        className="pointer-events-none absolute inset-0 opacity-90 print:hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(242,98,35,0.22) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(134,37,32,0.35) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,140,0,0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] print:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <AdminSidebar adminEmail={admin.email} role={admin.role} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col print:block print:w-full print:p-0 print:m-0">
        <header className="admin-glass relative z-30 flex items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur-xl print:hidden">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#FFB89A]/80">
              ACCESS CRM
            </p>
            <h1 className="title-header text-xl font-extrabold tracking-wide sm:text-2xl">
              Administration
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell initialNotifications={notifications} />
            {admin.email ? (
              <p className="hidden text-right text-xs text-white/55 sm:block">
                <span className="block text-[10px] uppercase tracking-widest text-white/35">
                  Signed in as
                </span>
                {admin.email}
              </p>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-[#F26223]/50 hover:bg-[#F26223]/15 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible print:block print:w-full print:p-0 print:m-0">{children}</main>
      </div>
    </div>
  );
}
