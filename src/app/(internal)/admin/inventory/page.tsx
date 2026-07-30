import {
  createEquipmentAction,
  updateEquipmentAction,
  deleteEquipmentAction,
} from "@/features/inventory/actions/equipments.actions";
import {
  getEquipmentsForAdmin,
  getEquipmentCategories,
} from "@/features/inventory/services/equipments.admin.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { DeleteEquipmentButton } from "./DeleteEquipmentButton";
import { EditEquipmentModal } from "./EditEquipmentModal";
import {
  AdminCard,
  AdminEmptyState,
  AdminFilterPills,
  AdminPageHeader,
  AdminPageShell,
} from "../components/admin-ui";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    feedback?: "success" | "error";
    message?: string;
    page?: string;
    category?: "All" | "MATERIALS" | "EQUIPMENTS" | "TOOLS";
    q?: string;
  }>;
};

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const feedback = params.feedback;
  const message = params.message;
  const currentPage = Number(params.page) || 1;
  const currentCategory = params.category ?? "All";
  const currentQuery = params.q?.trim() ?? "";

  const { data: equipments, meta } = await getEquipmentsForAdmin({
    page: currentPage,
    limit: 50,
    category: currentCategory,
    search: currentQuery,
  });

  const allCategories = await getEquipmentCategories();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentRole: string | null = null;
  if (user?.id) {
    const { data: userRow } = await supabase
      .from("Users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    currentRole = userRow?.role ?? null;
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createEquipmentAction({ status: "idle" }, formData);
    if (result.status === "error") {
      redirect(`/admin/inventory?feedback=error&message=${encodeURIComponent(result.message)}`);
    }
    redirect("/admin/inventory?feedback=success&message=Equipment%20added%20successfully");
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateEquipmentAction({ status: "idle" }, formData);
    if (result.status === "error") {
      redirect(`/admin/inventory?feedback=error&message=${encodeURIComponent(result.message)}`);
    }
    redirect("/admin/inventory?feedback=success&message=Equipment%20updated%20successfully");
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const result = await deleteEquipmentAction({ status: "idle" }, formData);
    if (result.status === "error") {
      redirect(`/admin/inventory?feedback=error&message=${encodeURIComponent(result.message)}`);
    }
    redirect("/admin/inventory?feedback=success&message=Equipment%20deleted%20successfully");
  }

  return (
    <AdminPageShell width="wide">
      <AdminPageHeader
        eyebrow="Operations"
        title="Inventory"
        description="Manage your materials, equipments, and tools available for borrowing."
      />

        {feedback && message && (
          <section
            className={
              feedback === "success"
                ? "rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
                : "rounded-lg border border-red-700/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            }
          >
            <p>{message}</p>
          </section>
        )}

        <AdminFilterPills
          options={["All", ...allCategories]}
          current={currentCategory}
          buildHref={(option) => `?category=${option}&page=1${currentQuery ? `&q=${currentQuery}` : ""}`}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:justify-between">
          <form className="flex w-full sm:w-auto items-center gap-3">
            <input
              type="text"
              name="q"
              placeholder="Search..."
              defaultValue={currentQuery}
              className="h-9 w-full sm:w-64 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223]"
            />
            <input type="hidden" name="category" value={currentCategory} />
            <button
              type="submit"
              className="admin-btn admin-btn-secondary h-9"
            >
              Filter
            </button>
            {(currentQuery || currentCategory !== "All") && (
              <Link
                href="/admin/inventory"
                className="admin-link text-sm"
              >
                Clear
              </Link>
            )}
          </form>

          {/* ADD EQUIPMENT FORM */}
          <AdminCard title="Add New Item" description="Create a new entry in the inventory.">
            <form action={handleCreate} className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">Name</label>
                <input required type="text" name="name" className="h-8 w-40 rounded-md border border-white/20 bg-black/20 px-2 text-xs text-white" placeholder="e.g. CHESS" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">Category</label>
                <input required type="text" name="category" list="category-list" className="h-8 rounded-md border border-white/20 bg-black/20 px-2 text-xs text-white" placeholder="e.g. ELECTRONICS" />
                <datalist id="category-list">
                  {allCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">Quantity</label>
                <input required type="number" name="quantity" min="0" defaultValue="1" className="h-8 w-16 rounded-md border border-white/20 bg-black/20 px-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">Unit</label>
                <input type="text" name="unit" className="h-8 w-16 rounded-md border border-white/20 bg-black/20 px-2 text-xs text-white" placeholder="PCS" />
              </div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary h-8 mb-[1px]"
              >
                Add Item
              </button>
            </form>
          </AdminCard>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipments.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <AdminEmptyState>No equipments found.</AdminEmptyState>
                  </td>
                </tr>
              ) : (
                equipments.map((eq) => (
                  <tr key={eq.id}>
                    <td className="font-semibold text-white">{eq.name}</td>
                    <td>
                      <span className="admin-badge admin-badge-neutral">{eq.category}</span>
                    </td>
                    <td>
                      <span className="font-bold text-white/90">{eq.quantity}</span> <span className="text-white/45 text-xs">{eq.unit}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <EditEquipmentModal
                          equipment={eq}
                          allCategories={allCategories}
                          action={handleUpdate}
                        />
                        <form action={handleDelete}>
                          <input type="hidden" name="id" value={eq.id} />
                          <DeleteEquipmentButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-white/45">
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              {meta.page > 1 && (
                <Link href={`?category=${currentCategory}&page=${meta.page - 1}${currentQuery ? `&q=${currentQuery}` : ""}`} className="admin-btn admin-btn-secondary">
                  Previous
                </Link>
              )}
              {meta.page < meta.totalPages && (
                <Link href={`?category=${currentCategory}&page=${meta.page + 1}${currentQuery ? `&q=${currentQuery}` : ""}`} className="admin-btn admin-btn-primary">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}

    </AdminPageShell>
  );
}
