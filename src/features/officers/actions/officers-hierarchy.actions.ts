"use server";

import { revalidatePath } from "next/cache";
import {
  saveOfficerCardItem,
  deleteOfficerCardItem,
} from "../services/officers-hierarchy.service";
import { OfficerHierarchyItemSchema, type OfficersHierarchyContent } from "../schemas";

export type OfficerActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: OfficersHierarchyContent;
};

export async function saveOfficerHierarchyAction(
  prevState: OfficerActionState,
  formData: FormData
): Promise<OfficerActionState> {
  try {
    const rawData = {
      id: formData.get("id")?.toString() || crypto.randomUUID(),
      name: formData.get("name")?.toString() || "",
      displayName: formData.get("displayName")?.toString() || "",
      role: formData.get("role")?.toString() || "",
      tierId: formData.get("tierId")?.toString() || "tier-president",
      courseYear: formData.get("courseYear")?.toString() || "",
      bio: formData.get("bio")?.toString() || "",
      hideBio: formData.get("hideBio") === "on" || formData.get("hideBio") === "true",
      email: formData.get("email")?.toString() || "",
      facebookUrl: formData.get("facebookUrl")?.toString() || "",
      linkedinUrl: formData.get("linkedinUrl")?.toString() || "",
      githubUrl: formData.get("githubUrl")?.toString() || "",
      imageUrl: formData.get("imageUrl")?.toString() || "",
      bannerUrl: formData.get("bannerUrl")?.toString() || "",
      display_order: Number(formData.get("display_order") || 0),
      is_active: formData.get("is_active") === "false" ? false : true,
    };

    const parsed = OfficerHierarchyItemSchema.safeParse(rawData);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return { status: "error", message: errorMsg };
    }

    const imageFile = formData.get("imageFile") as File | null;
    const bannerFile = formData.get("bannerFile") as File | null;

    const updatedContent = await saveOfficerCardItem(parsed.data, imageFile, bannerFile);

    revalidatePath("/officers");
    revalidatePath("/admin/officers");
    revalidatePath("/");

    return {
      status: "success",
      message: `Saved officer: ${parsed.data.name}`,
      data: updatedContent,
    };
  } catch (error) {
    console.error("[saveOfficerHierarchyAction]", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save officer",
    };
  }
}

export async function deleteOfficerHierarchyAction(
  prevState: OfficerActionState,
  officerId: string
): Promise<OfficerActionState> {
  try {
    if (!officerId) {
      return { status: "error", message: "Officer ID is required" };
    }

    const updatedContent = await deleteOfficerCardItem(officerId);

    revalidatePath("/officers");
    revalidatePath("/admin/officers");
    revalidatePath("/");

    return {
      status: "success",
      message: "Officer removed successfully",
      data: updatedContent,
    };
  } catch (error) {
    console.error("[deleteOfficerHierarchyAction]", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete officer",
    };
  }
}
