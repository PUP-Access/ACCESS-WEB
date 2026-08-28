import { z } from "zod";

export const HeroContentSchema = z.object({
  titleLines: z.array(z.string().min(1)).min(1).max(5),
  subtitle: z.string().min(1),
  primaryCtaLabel: z.string().min(1),
  secondaryCtaLabel: z.string().min(1),
});

export const AboutContentSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional().default("center"),
  carouselImages: z.array(z.string()).optional().default([
    "/AboutUsPic.webp",
  ]),
});

export const OfficersSectionPartSchema = z.object({
  id: z.string(),
  label: z.string(),
  link: z.string(),
  imageUrl: z.string().optional(),
  isVisible: z.boolean().optional().default(true),
});

export const OfficersSectionContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  templateImageUrl: z.string().min(1),
  parts: z.array(OfficersSectionPartSchema).optional().default([]),
});

export const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  display_order: z.coerce.number().int().min(0).optional(),
  is_active: z.coerce.boolean().optional(),
});

export const UpdateFAQItemSchema = FAQItemSchema.partial().extend({
  id: z.string().uuid(),
});

export const ContactMessageSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().refine((val) => val.toLowerCase().endsWith('.com'), {
    message: "Email must end with .com",
  }),
  courseYearSection: z.string().min(1),
  contactNumber: z.string().regex(/^\+63\s9\d{9}$/, { message: "Enter a valid PH number starting with 9" }),
  organization: z.string().min(1),
  purpose: z.string().min(1),
  concern: z.string().min(1).refine((val) => val.trim().split(/\s+/).length <= 512, {
    message: "Concern cannot exceed 512 words",
  }),
});

export const SponsorPartnerItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  logoUrl: z.string().min(1),
  websiteUrl: z.string().optional().default(""),
  type: z.enum(["sponsor", "partner"]).default("sponsor"),
  tier: z.enum(["featured", "standard"]).default("standard"),
  category: z.string().optional().default(""),
  isVisible: z.boolean().default(true),
  orderIndex: z.number().optional().default(0),
});

export const SponsorsPartnersContentSchema = z.object({
  landingTitle: z.string().min(1).default("OUR SPONSORS & PARTNERS"),
  landingSubtitle: z
    .string()
    .min(1)
    .default(
      "Proudly supported by organizations that share our vision for service, innovation, and technical excellence."
    ),
  sponsorsTitle: z.string().min(1).default("ACCESS Sponsors"),
  sponsorsSubtitle: z
    .string()
    .min(1)
    .default(
      "Empowering computer engineering students through state-of-the-art technological resources and event support."
    ),
  partnersTitle: z.string().min(1).default("ACCESS Partners"),
  partnersSubtitle: z
    .string()
    .min(1)
    .default(
      "Collaborating with industry leaders, student organizations, and academic institutions."
    ),
  ctaLabel: z.string().min(1).default("Want to be our partner?"),
  items: z.array(SponsorPartnerItemSchema).default([]),
});

export type HeroContent = z.infer<typeof HeroContentSchema>;
export type AboutContent = z.infer<typeof AboutContentSchema>;
export type OfficersSectionPart = z.infer<typeof OfficersSectionPartSchema>;
export type OfficersSectionContent = z.infer<typeof OfficersSectionContentSchema>;
export type SponsorPartnerItem = z.infer<typeof SponsorPartnerItemSchema>;
export type SponsorsPartnersContent = z.infer<typeof SponsorsPartnersContentSchema>;

export const DEFAULT_HERO_CONTENT: HeroContent = {
  titleLines: [
    "ASSOCIATION OF CONCERNED",
    "COMPUTER ENGINEERING",
    "STUDENTS FOR SERVICE",
  ],
  subtitle:
    "We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.",
  primaryCtaLabel: "About us",
  secondaryCtaLabel: "Officers",
};

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  title: "About Us",
  body: "We are the PUP Association of Concerned Computer Engineering Students for Service (PUP ACCESS), the official student organization of the Computer Engineering Department at the Polytechnic University of the Philippines. We are committed to unlocking the potential of computer engineering students by creating avenues and services that provide valuable knowledge, experiences, and opportunities to fulfill their academic, co-curricular, and extracurricular needs and concerns.\n\nCurrently, the organization comprises 19 dedicated Officers, along with Junior ACCESS Officers and Subordinates, serving over 1,500 students in the Computer Engineering Department of the university. The organization has been yearly revalidated by the PUP Student Council Commission on Student Organizations and Accreditation (PUP SC COSOA) and the PUP Student Council Commission on Audit (PUP SC COA), upholding transparency, accountability, and organizational excellence.",
  textAlign: "center",
  carouselImages: [
    "/AboutUsPic.webp",
  ],
};

export const DEFAULT_OFFICERS_SECTION_CONTENT: OfficersSectionContent = {
  title: "Meet the Officers",
  subtitle:
    "We are a community of student leaders and innovators committed to advancing technology, collaboration, and excellence within PUP.",
  templateImageUrl: "/meet-the-officers.webp",
  parts: [
    {
      id: "part-1",
      label: "ACCESS Officers",
      link: "/officers",
      imageUrl: "",
      isVisible: true,
    },
    {
      id: "part-2",
      label: "Class Representatives",
      link: "/officers/class-representatives",
      imageUrl: "",
      isVisible: true,
    },
    {
      id: "part-3",
      label: "Batch Representatives",
      link: "/officers/batch-representatives",
      imageUrl: "",
      isVisible: true,
    },
  ],
};

export const DEFAULT_SPONSORS_PARTNERS_CONTENT: SponsorsPartnersContent = {
  landingTitle: "OUR SPONSORS & PARTNERS",
  landingSubtitle:
    "Proudly supported by organizations that share our vision for service, innovation, and technical excellence.",
  sponsorsTitle: "ACCESS Sponsors",
  sponsorsSubtitle:
    "Empowering computer engineering students through state-of-the-art technological resources and event support.",
  partnersTitle: "ACCESS Partners",
  partnersSubtitle:
    "Collaborating with industry leaders, student organizations, and academic institutions.",
  ctaLabel: "Want to be our partner?",
  items: [
    {
      id: "sp-1",
      name: "Nexus Labs",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "sponsor",
      tier: "featured",
      category: "Co-Presenter",
      isVisible: true,
      orderIndex: 1,
    },
    {
      id: "sp-2",
      name: "Apex Global",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "sponsor",
      tier: "standard",
      category: "Gold Sponsor",
      isVisible: true,
      orderIndex: 2,
    },
    {
      id: "sp-3",
      name: "Cognitive AI",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "sponsor",
      tier: "standard",
      category: "Gold Sponsor",
      isVisible: true,
      orderIndex: 3,
    },
    {
      id: "sp-4",
      name: "Synapse Corp",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "sponsor",
      tier: "standard",
      category: "Silver Sponsor",
      isVisible: true,
      orderIndex: 4,
    },
    {
      id: "sp-5",
      name: "Vector Ventures",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "partner",
      tier: "featured",
      category: "Industry Partner",
      isVisible: true,
      orderIndex: 5,
    },
    {
      id: "sp-6",
      name: "Orion Systems",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "partner",
      tier: "standard",
      category: "Academic Partner",
      isVisible: true,
      orderIndex: 6,
    },
    {
      id: "sp-7",
      name: "Kinetic Dynamics",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "partner",
      tier: "standard",
      category: "Media Partner",
      isVisible: true,
      orderIndex: 7,
    },
    {
      id: "sp-8",
      name: "Bare Elements",
      logoUrl: "",
      websiteUrl: "https://example.com",
      type: "partner",
      tier: "standard",
      category: "Community Partner",
      isVisible: true,
      orderIndex: 8,
    },
  ],
};
