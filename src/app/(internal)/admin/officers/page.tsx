import { getOfficersHierarchyContent } from "@/features/officers/services/officers-hierarchy.service";
import { getClassRepresentativesContent } from "@/features/officers/services/class-reps.service";
import { getBatchRepresentativesContent } from "@/features/officers/services/batch-reps.service";
import { AdminPageShell } from "../components/admin-ui";
import AdminOfficersManager from "./AdminOfficersManager";

export const dynamic = "force-dynamic";

export default async function AdminOfficersPage() {
  const [hierarchyContent, classRepsContent, batchRepsContent] = await Promise.all([
    getOfficersHierarchyContent(),
    getClassRepresentativesContent(),
    getBatchRepresentativesContent(),
  ]);

  return (
    <AdminPageShell width="wide">
      <AdminOfficersManager
        initialContent={hierarchyContent}
        initialClassReps={classRepsContent}
        initialBatchReps={batchRepsContent}
      />
    </AdminPageShell>
  );
}
