"use server";

import { revalidatePath } from "next/cache";
import { ContactMessageSchema } from "@/features/cms/schemas";
import { submitContactMessage } from "@/features/cms/services/contact-messages.service";
import { getErrorMessage } from "@/lib/errors";

type ActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function submitContactMessageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = ContactMessageSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      courseYearSection: formData.get("courseYearSection"),
      contactNumber: formData.get("contactNumber"),
      organization: formData.get("organization"),
      purpose: formData.get("purpose"),
      concern: formData.get("concern"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues.map((i) => i.message).at(0) ?? "Invalid input",
      };
    }

    const createdMessage = await submitContactMessage({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      course_year_section: parsed.data.courseYearSection,
      contact_number: parsed.data.contactNumber,
      organization: parsed.data.organization,
      purpose: parsed.data.purpose,
      concern: parsed.data.concern,
    });

    // Send automated inquiry acknowledgment email
    if (process.env.RESEND_API_KEY && parsed.data.email) {
      try {
        const { Resend } = await import("resend");
        const { renderAccessEmail } = await import("@/lib/email/email-template");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailHtml = renderAccessEmail({
          title: "Inquiry Received",
          preheader: `Thank you for contacting PUP ACCESS. We have received your message.`,
          statusLabel: "Inquiry Logged",
          salutation: `Dear ${parsed.data.fullName},`,
          leadParagraph: `Thank you for reaching out to <strong>PUP ACCESS</strong>. We confirm that your inquiry has been received and queued for administrative review.`,
          secondaryParagraph: `Our officers review incoming messages regularly. An administrator will review your message and follow up with you via this email address.`,
          details: [
            { label: "Sender Name", value: parsed.data.fullName },
            { label: "Email Address", value: parsed.data.email },
            ...(parsed.data.organization ? [{ label: "Organization", value: parsed.data.organization }] : []),
            ...(parsed.data.purpose ? [{ label: "Purpose / Topic", value: parsed.data.purpose }] : []),
            { label: "Your Concern", value: parsed.data.concern },
          ],
          notice: {
            title: "Review Notice",
            content: "You will receive a response once an officer reviews your concern. For urgent inquiries or laboratory access, you may also visit us at Room 424, CEA Building.",
          },
          cta: {
            text: "Visit PUP ACCESS Portal",
            url: "https://pupaccess.org",
          },
          closingRemark: "Thank you for connecting with us.",
        });

        await resend.emails.send({
          from: "ACCESS <noreply@pupaccess.org>",
          to: parsed.data.email,
          subject: `Inquiry Received: ${parsed.data.purpose || "Contact Message"} | ACCESS`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error("Failed to send contact inquiry acknowledgment email:", emailErr);
      }
    }

    revalidatePath("/admin/contact-messages");
    revalidatePath("/admin");

    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err, "Failed to submit message"),
    };
  }
}
