"use server";

import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/errors";
import { revalidatePublicSite } from "../revalidate-public-site";
import {
  AboutContentSchema,
  HeroContentSchema,
  OfficersSectionContentSchema,
} from "../schemas";
import {
  updateSiteContent,
  uploadSiteContentImage,
  uploadOfficersRosterImage,
} from "../services/site-content.service";
import {
  createFAQItem,
  deleteFAQItem,
  updateFAQItem,
} from "../services/faq.service";
import { markContactMessageRead } from "../services/contact-messages.service";
import { FAQItemSchema, UpdateFAQItemSchema } from "../schemas";

type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

export async function updateHeroContentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const titleLines = [
      formData.get("titleLine1"),
      formData.get("titleLine2"),
      formData.get("titleLine3"),
    ]
      .filter((line): line is string => typeof line === "string" && line.trim().length > 0)
      .map((line) => line.trim());

    const parsed = HeroContentSchema.safeParse({
      titleLines,
      subtitle: formData.get("subtitle"),
      primaryCtaLabel: formData.get("primaryCtaLabel"),
      secondaryCtaLabel: formData.get("secondaryCtaLabel"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await updateSiteContent("hero", parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/landing");

    return { status: "success", message: "Landing content updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update landing content"),
    };
  }
}

export async function updateAboutContentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = AboutContentSchema.safeParse({
      title: formData.get("title"),
      body: formData.get("body"),
      textAlign: formData.get("textAlign"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await updateSiteContent("about", parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/about");

    return { status: "success", message: "About content updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update about content"),
    };
  }
}

export async function updateAboutImagesAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { getAboutContent, uploadSiteContentImage } = await import("../services/site-content.service");
    const current = await getAboutContent();
    const newImages = [...(current.carouselImages || [])];

    // We expect up to 5 images
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`image${i}`);
      if (file instanceof File && file.size > 0) {
        newImages[i] = await uploadSiteContentImage(file);
      }
    }

    const parsed = AboutContentSchema.safeParse({
      ...current,
      carouselImages: newImages,
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await updateSiteContent("about", parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/about-images");
    revalidatePath("/admin/content/about");
    revalidatePath("/"); // Update landing page too

    return { status: "success", message: "About images updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update about images"),
    };
  }
}

export async function updateOfficersSectionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { getOfficersSectionContent } = await import("../services/site-content.service");
    const current = await getOfficersSectionContent();
    const templateFile = formData.get("templateImage");
    let templateImageUrl =
      typeof formData.get("templateImageUrl") === "string"
        ? (formData.get("templateImageUrl") as string)
        : "/meet-the-officers.webp";

    if (templateFile instanceof File && templateFile.size > 0) {
      templateImageUrl = await uploadSiteContentImage(templateFile);
    }

    // Parse dynamic buttons
    let parts = current.parts || [];
    const partsJson = formData.get("partsJson");
    if (typeof partsJson === "string") {
      try {
        const parsedParts = JSON.parse(partsJson);
        // Preserve imageUrls when updating labels/links
        parts = parsedParts.map((p: any) => {
          const existing = parts.find((ep) => ep.id === p.id);
          return {
            id: p.id,
            label: p.label,
            link: p.link,
            imageUrl: existing?.imageUrl || "",
          };
        });
      } catch (e) {
        console.error("Failed to parse partsJson", e);
      }
    }

    const parsed = OfficersSectionContentSchema.safeParse({
      title: formData.get("title"),
      subtitle: formData.get("subtitle"),
      templateImageUrl,
      parts,
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await updateSiteContent("officers_section", parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/officers-template");

    return { status: "success", message: "Officers section updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update officers section"),
    };
  }
}

export async function updateOfficersRosterAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const { getOfficersSectionContent } = await import("../services/site-content.service");
    const current = await getOfficersSectionContent();

    let parts = [...(current.parts || [])];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const file = formData.get(`image_${part.id}`);
      if (file instanceof File && file.size > 0) {
        parts[i].imageUrl = await uploadOfficersRosterImage(file);
      }
    }

    const parsed = OfficersSectionContentSchema.safeParse({
      ...current,
      parts,
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await updateSiteContent("officers_section", parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/officers-roster");
    revalidatePath("/officers");

    return { status: "success", message: "Officers image updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update officers image"),
    };
  }
}

export async function createFAQAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = FAQItemSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    await createFAQItem(parsed.data);
    revalidatePublicSite();
    revalidatePath("/admin/content/faqs");

    return { status: "success", message: "FAQ created." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to create FAQ"),
    };
  }
}

export async function updateFAQAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const raw = Object.fromEntries(formData);
    const parsed = UpdateFAQItemSchema.safeParse({
      ...raw,
      is_active: raw.is_active === "true",
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    const { id, ...updates } = parsed.data;
    await updateFAQItem(id, updates);
    revalidatePublicSite();
    revalidatePath("/admin/content/faqs");

    return { status: "success", message: "FAQ updated." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to update FAQ"),
    };
  }
}

export async function deleteFAQAction(
  _prevState: ActionState,
  id: string
): Promise<ActionState> {
  try {
    await deleteFAQItem(id);
    revalidatePublicSite();
    revalidatePath("/admin/content/faqs");

    return { status: "success", message: "FAQ deleted." };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to delete FAQ"),
    };
  }
}

export async function markContactMessageReadAction(id: string): Promise<ActionState> {
  try {
    await markContactMessageRead(id);
    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");

    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to mark message as read"),
    };
  }
}

export async function replyContactMessageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;

    if (!id || !email || !subject || !message) {
      return { status: "error", message: "Missing required fields" };
    }

    if (!process.env.RESEND_API_KEY) {
      return { status: "error", message: "RESEND_API_KEY is not configured on the server." };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "ACCESS <noreply@pupaccess.org>",
      to: email,
      subject: subject,
      text: message,
    });

    if (error) {
      console.error("Resend error:", error);
      return { status: "error", message: error.message || "Failed to send email" };
    }

    // Mark as read after replying
    await markContactMessageRead(id);
    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");

    return { status: "success", message: "Reply sent successfully." };
  } catch (err) {
    console.error("Reply error:", err);
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to send reply"),
    };
  }
}
