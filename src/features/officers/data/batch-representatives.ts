import type { BatchRepsContent } from "../schemas";

function createDefaultYearOfficers(yearId: string, yearLabel: string, sectionDefault: string) {
  const roles = [
    { role: "PRESIDENT", idSuffix: "pres", order: 1 },
    { role: "Vice President", idSuffix: "vp", order: 2 },
    { role: "Secretary", idSuffix: "sec", order: 3 },
    { role: "Assistant Secretary", idSuffix: "asst-sec", order: 4 },
    { role: "Treasurer", idSuffix: "treas", order: 5 },
    { role: "Auditor", idSuffix: "aud", order: 6 },
    { role: "PIO", idSuffix: "pio", order: 7 },
    { role: "Logistic Head", idSuffix: "log", order: 8 },
  ];

  return roles.map((r) => ({
    id: `batch-${yearId}-${r.idSuffix}`,
    name: r.order === 1 ? "Antonio Mickel Tantia" : "Antonio Mickel Tantia",
    displayName: "Antonio Mickel Tantia",
    role: r.role,
    batchId: yearId,
    batchYear: yearLabel,
    courseYear: sectionDefault,
    bio: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    imageUrl: r.order === 1 ? "/officers/tantia-antonio-mickel.webp" : "/circle-access-logo.webp",
    email: r.order === 1 ? "tantia.antonio@access.org" : "",
    facebookUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    bannerUrl: "",
    display_order: r.order,
    is_active: true,
  }));
}

export const DEFAULT_BATCH_REPRESENTATIVES: BatchRepsContent = [
  {
    id: "1st-year",
    label: "1st Years",
    batchNumber: "1st",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultYearOfficers("1st-year", "1st Year", "BSCPE 1-1"),
  },
  {
    id: "2nd-year",
    label: "2nd Years",
    batchNumber: "2nd",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultYearOfficers("2nd-year", "2nd Year", "BSCPE 2-1"),
  },
  {
    id: "3rd-year",
    label: "3rd Years",
    batchNumber: "3rd",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultYearOfficers("3rd-year", "3rd Year", "BSCPE 3-1"),
  },
  {
    id: "4th-year",
    label: "4th Years",
    batchNumber: "4th",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultYearOfficers("4th-year", "4th Year", "BSCPE 4-1"),
  },
  {
    id: "p-year",
    label: "P Years",
    batchNumber: "P",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultYearOfficers("p-year", "P Year", "BSCPE P-1"),
  },
];
