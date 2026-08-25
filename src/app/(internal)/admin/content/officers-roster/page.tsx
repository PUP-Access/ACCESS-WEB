import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminOfficersRosterPage() {
  redirect("/admin/officers");
}
