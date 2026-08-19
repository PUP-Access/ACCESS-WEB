/**
 * ACCESS Institutional Email Template System
 * Minimalist, formal, and elegant design for PUP ACCESS.
 */

export interface EmailDetailRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface EmailNoticeBox {
  title?: string;
  content: string;
}

export interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  statusLabel?: string;
  recipientName?: string;
  salutation?: string;
  leadParagraph: string;
  secondaryParagraph?: string;
  details?: EmailDetailRow[];
  notice?: EmailNoticeBox;
  cta?: {
    text: string;
    url: string;
  };
  closingRemark?: string;
}

export function renderAccessEmail(options: EmailTemplateOptions): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pupaccess.org";
  const siteUrl = rawSiteUrl.replace(/\/$/, "");
  const logoUrl = `${siteUrl}/circle-access-logo.webp`;
  const greeting = options.salutation || (options.recipientName ? `Dear ${options.recipientName},` : "Greetings,");
  const ctaUrl = options.cta ? options.cta.url : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #374151; }
  </style>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #374151; -webkit-font-smoothing: antialiased;">
  ${options.preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${escapeHtml(options.preheader)}</div>` : ""}

  <!-- Outer Container -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
    
    <!-- Top Accent Line -->
    <tr>
      <td style="height: 3px; background-color: #F26223;"></td>
    </tr>

    <!-- Header / Brand -->
    <tr>
      <td style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f3f4f6;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="width: 52px; vertical-align: middle;">
              <img src="${logoUrl}" alt="ACCESS Logo" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 50%; object-fit: contain;" />
            </td>
            <td style="padding-left: 14px; vertical-align: middle;">
              <div style="font-size: 16px; font-weight: 700; color: #111827; letter-spacing: 0.3px; line-height: 1.2;">
                PUP ACCESS
              </div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.3;">
                Association of Concerned Computer Engineering Students for Service<br />
                Polytechnic University of the Philippines – Manila
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 28px 32px;">

        <!-- Status Tag (Optional, clean & minimal) -->
        ${
          options.statusLabel
            ? `
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; padding: 3px 10px; background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase;">
            ${escapeHtml(options.statusLabel)}
          </span>
        </div>`
            : ""
        }

        <!-- Email Subject / Heading -->
        <h1 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 700; color: #111827; line-height: 1.35;">
          ${escapeHtml(options.title)}
        </h1>

        <!-- Salutation -->
        <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #1f2937;">
          ${escapeHtml(greeting)}
        </p>

        <!-- Lead Paragraph -->
        <p style="margin: 0 0 14px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
          ${options.leadParagraph}
        </p>

        ${
          options.secondaryParagraph
            ? `
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
          ${options.secondaryParagraph}
        </p>`
            : ""
        }

        <!-- Details Summary Table (Optional) -->
        ${
          options.details && options.details.length > 0
            ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
          ${options.details
            .map(
              (row, idx) => `
            <tr>
              <td style="padding: 10px 14px; width: 38%; font-size: 13px; font-weight: 500; color: #6b7280; border-bottom: ${idx === options.details!.length - 1 ? "none" : "1px solid #e5e7eb"}; vertical-align: top;">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding: 10px 14px; font-size: 13px; color: ${row.highlight ? "#c2410c" : "#111827"}; font-weight: ${row.highlight ? "600" : "500"}; border-bottom: ${idx === options.details!.length - 1 ? "none" : "1px solid #e5e7eb"}; vertical-align: top;">
                ${row.value}
              </td>
            </tr>
          `
            )
            .join("")}
        </table>`
            : ""
        }

        <!-- Guidelines / Policy Box (Optional) -->
        ${
          options.notice
            ? `
        <div style="margin: 18px 0; padding: 14px; background-color: #fffaf5; border-left: 3px solid #F26223; border-radius: 4px;">
          ${
            options.notice.title
              ? `<div style="margin-bottom: 4px; font-size: 13px; font-weight: 600; color: #9a3412;">
                  ${escapeHtml(options.notice.title)}
                </div>`
              : ""
          }
          <div style="font-size: 13px; color: #78350f; line-height: 1.55;">
            ${options.notice.content}
          </div>
        </div>`
            : ""
        }

        <!-- Action Button (Optional) -->
        ${
          options.cta
            ? `
        <div style="margin: 22px 0 14px 0; text-align: left;">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" style="background-color: #F26223; color: #ffffff; text-decoration: none; padding: 10px 22px; font-size: 13px; font-weight: 600; border-radius: 6px; display: inline-block;">
            ${escapeHtml(options.cta.text)}
          </a>
        </div>
        <div style="margin: 0 0 18px 0; padding-top: 10px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.5;">
          <p style="margin: 0 0 4px 0;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="margin: 0; word-break: break-all;">
            <a href="${escapeHtml(ctaUrl)}" style="color: #F26223; text-decoration: underline;">${escapeHtml(ctaUrl)}</a>
          </p>
        </div>`
            : ""
        }

        <!-- Closing Remarks & Sign-off -->
        ${
          options.closingRemark
            ? `
        <p style="margin: 18px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
          ${options.closingRemark}
        </p>`
            : ""
        }
        
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #374151; line-height: 1.6;">
          In best service,<br />
          <strong style="color: #111827;">PUP ACCESS</strong>
        </p>

      </td>
    </tr>

    <!-- Minimalist Footer -->
    <tr>
      <td style="padding: 18px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #6b7280;">
          Association of Concerned Computer Engineering Students for Service
        </p>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #9ca3af; line-height: 1.4;">
          Room 424, College of Engineering and Architecture (CEA) Building<br />
          Polytechnic University of the Philippines – Manila
        </p>
        <p style="margin: 0; font-size: 11px;">
          <a href="${siteUrl}" style="color: #F26223; text-decoration: none; font-weight: 500;">pupaccess.org</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
