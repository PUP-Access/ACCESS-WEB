"use server";

import { revalidatePath } from "next/cache";
import { uploadOfficerAsset } from "../services/officers-hierarchy.service";
import {
  saveClassRepItem,
  deleteClassRepItem,
} from "../services/class-reps.service";
import { ClassRepItemSchema, type ClassRepsContent } from "../schemas";

export type ClassRepActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: ClassRepsContent;
};

export async function saveClassRepAction(
  _prevState: ClassRepActionState,
  formData: FormData
): Promise<ClassRepActionState> {
  try {
    const rawId = formData.get("id") as string;
    const id = rawId?.trim() ? rawId : crypto.randomUUID();

    let imageUrl = (formData.get("imageUrl") as string) || "";
    let bannerUrl = (formData.get("bannerUrl") as string) || "";

    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadOfficerAsset(imageFile, "class-reps");
    }

    const bannerFile = formData.get("bannerFile") as File | null;
    if (bannerFile && bannerFile.size > 0) {
      bannerUrl = await uploadOfficerAsset(bannerFile, "banners");
    }

    const rawData = {
      id,
      name: formData.get("name"),
      displayName: formData.get("displayName") || "",
      role: formData.get("role") || "CLASS REPRESENTATIVE",
      yearId: formData.get("yearId") || "1st-year",
      section: formData.get("section") || "BSCPE 1-1",
      courseYear: formData.get("section") || formData.get("courseYear") || "",
      bio: formData.get("bio") || "",
      hideBio: formData.get("hideBio") === "on" || formData.get("hideBio") === "true",
      email: formData.get("email") || "",
      facebookUrl: formData.get("facebookUrl") || "",
      linkedinUrl: formData.get("linkedinUrl") || "",
      githubUrl: formData.get("githubUrl") || "",
      imageUrl,
      bannerUrl,
    };

    const parsed = ClassRepItemSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid input data",
      };
    }

    const updatedContent = await saveClassRepItem(parsed.data);

    revalidatePath("/officers/class-representatives");
    revalidatePath("/admin/officers");

    return {
      status: "success",
      message: `Class Representative ${parsed.data.name} saved successfully.`,
      data: updatedContent,
    };
  } catch (error) {
    console.error("[saveClassRepAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save class representative",
    };
  }
}

export async function deleteClassRepAction(
  _prevState: ClassRepActionState,
  id: string
): Promise<ClassRepActionState> {
  try {
    const updatedContent = await deleteClassRepItem(id);

    revalidatePath("/officers/class-representatives");
    revalidatePath("/admin/officers");

    return {
      status: "success",
      message: "Class Representative deleted successfully.",
      data: updatedContent,
    };
  } catch (error) {
    console.error("[deleteClassRepAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete class representative",
    };
  }
}
