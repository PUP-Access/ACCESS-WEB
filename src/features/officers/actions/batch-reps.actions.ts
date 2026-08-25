"use server";

import { revalidatePath } from "next/cache";
import { uploadOfficerAsset } from "../services/officers-hierarchy.service";
import {
  saveBatchRepItem,
  deleteBatchRepItem,
} from "../services/batch-reps.service";
import { BatchRepItemSchema, type BatchRepsContent } from "../schemas";

export type BatchRepActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: BatchRepsContent;
};

export async function saveBatchRepAction(
  _prevState: BatchRepActionState,
  formData: FormData
): Promise<BatchRepActionState> {
  try {
    const rawId = formData.get("id") as string;
    const id = rawId?.trim() ? rawId : crypto.randomUUID();

    let imageUrl = (formData.get("imageUrl") as string) || "";
    let bannerUrl = (formData.get("bannerUrl") as string) || "";

    const imageFile = formData.get("imageFile") as File | null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadOfficerAsset(imageFile, "batch-reps");
    }

    const bannerFile = formData.get("bannerFile") as File | null;
    if (bannerFile && bannerFile.size > 0) {
      bannerUrl = await uploadOfficerAsset(bannerFile, "banners");
    }

    const rawData = {
      id,
      name: formData.get("name"),
      displayName: formData.get("displayName") || "",
      role: formData.get("role") || "BATCH REPRESENTATIVE",
      batchId: formData.get("batchId") || "batch-2022",
      batchYear: formData.get("batchYear") || "",
      courseYear: formData.get("courseYear") || "",
      bio: formData.get("bio") || "",
      email: formData.get("email") || "",
      facebookUrl: formData.get("facebookUrl") || "",
      linkedinUrl: formData.get("linkedinUrl") || "",
      githubUrl: formData.get("githubUrl") || "",
      imageUrl,
      bannerUrl,
    };

    const parsed = BatchRepItemSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid input data",
      };
    }

    const updatedContent = await saveBatchRepItem(parsed.data);

    revalidatePath("/officers/batch-representatives");
    revalidatePath("/admin/officers");

    return {
      status: "success",
      message: `Batch Representative ${parsed.data.name} saved successfully.`,
      data: updatedContent,
    };
  } catch (error) {
    console.error("[saveBatchRepAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save batch representative",
    };
  }
}

export async function deleteBatchRepAction(
  _prevState: BatchRepActionState,
  id: string
): Promise<BatchRepActionState> {
  try {
    const updatedContent = await deleteBatchRepItem(id);

    revalidatePath("/officers/batch-representatives");
    revalidatePath("/admin/officers");

    return {
      status: "success",
      message: "Batch Representative deleted successfully.",
      data: updatedContent,
    };
  } catch (error) {
    console.error("[deleteBatchRepAction] Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete batch representative",
    };
  }
}
