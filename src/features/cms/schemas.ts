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
    "/aboutCard1.JPG",
    "/aboutCard2.jpg",
    "/aboutCard3.jpg",
    "/aboutCard4.jpg",
    "/aboutCard5.jpg",
  ]),
});

export const OfficersSectionContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  templateImageUrl: z.string().min(1),
  parts: z.array(z.object({
    id: z.string(),
    label: z.string(),
    link: z.string(),
    imageUrl: z.string().optional(),
  })).optional().default([]),
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

export const BorrowRequestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  courseYearSection: z.string().min(1),
  contactNumber: z.string().min(1),
  organization: z.string().min(1),
  purpose: z.string().min(1),
  additionalInfo: z.string().optional(),
  item: z.string().min(1),
  startDate: z.string().min(1),
  startHour: z.string().min(1),
  startMinute: z.string().min(1),
  startPeriod: z.enum(["AM", "PM"]),
  endDate: z.string().min(1),
  endHour: z.string().min(1),
  endMinute: z.string().min(1),
  endPeriod: z.enum(["AM", "PM"]),
});

export type HeroContent = z.infer<typeof HeroContentSchema>;
export type AboutContent = z.infer<typeof AboutContentSchema>;
export type OfficersSectionContent = z.infer<typeof OfficersSectionContentSchema>;

export const DEFAULT_HERO_CONTENT: HeroContent = {
  titleLines: [
    "Association of Concerned",
    "Computer Engineering Students",
    "for Service",
  ],
  subtitle:
    "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur Lorem ipsum",
  primaryCtaLabel: "Get Started",
  secondaryCtaLabel: "Get In Touch",
};

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  title: "About Us",
  body: "We are the PUP Association of Concerned Computer Engineering Students for Service (PUP ACCESS), the official student organization of the Computer Engineering Department at the Polytechnic University of the Philippines. We are committed to unlocking the potential of computer engineering students by creating avenues and services that provide valuable knowledge, experiences, and opportunities to fulfill their academic, co-curricular, and extracurricular needs and concerns.\n\nCurrently, the organization comprises 19 dedicated Officers, along with Junior ACCESS Officers and Subordinates, serving over 1,500 students in the Computer Engineering Department of the university. The organization has been yearly revalidated by the PUP Student Council Commission on Student Organizations and Accreditation (PUP SC COSOA) and the PUP Student Council Commission on Audit (PUP SC COA), upholding transparency, accountability, and organizational excellence.",
  textAlign: "center",
  carouselImages: [
    "/aboutCard1.JPG",
    "/aboutCard2.jpg",
    "/aboutCard3.jpg",
    "/aboutCard4.jpg",
    "/aboutCard5.jpg",
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
      label: "Batch Officers",
      link: "/officers#part-1",
      imageUrl: "",
    },
    {
      id: "part-2",
      label: "ACCESS",
      link: "/officers#part-2",
      imageUrl: "",
    },
    {
      id: "part-3",
      label: "Class Representatives",
      link: "/officers#part-3",
      imageUrl: "",
    },
  ],
};
