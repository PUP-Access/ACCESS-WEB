import type { OfficerItem } from "./officers-hierarchy";

export interface ClassRepSectionItem extends OfficerItem {
  section: string;
  yearId: string;
}

export interface YearLevelReps {
  id: string;
  label: string;
  yearNumber: string;
  description: string;
  sealUrl?: string;
  representatives: ClassRepSectionItem[];
}

function createDefaultClassReps(yearId: string, yearPrefix: string, sectionCount: number): ClassRepSectionItem[] {
  return Array.from({ length: sectionCount }, (_, i) => {
    const secNum = i + 1;
    const section = `BSCPE ${yearPrefix}-${secNum}`;

    return {
      id: `rep-${yearId}-${secNum}`,
      yearId,
      name: "Tantia, Antonio Mickel",
      displayName: "Antonio Mickel Tantia",
      role: "CLASS REPRESENTATIVE",
      section,
      courseYear: section,
      bio: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
      hideBio: false,
      imageUrl: "/officers/tantia-antonio-mickel.webp",
      bannerUrl: "",
      display_order: secNum,
      is_active: true,
      email: "tantia.antonio@access.org",
      facebookUrl: "https://facebook.com",
      linkedinUrl: "",
      githubUrl: "",
    };
  });
}

export const DEFAULT_CLASS_REPRESENTATIVES: YearLevelReps[] = [
  {
    id: "1st-year",
    label: "1st Years",
    yearNumber: "1st",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultClassReps("1st-year", "1", 7),
  },
  {
    id: "2nd-year",
    label: "2nd Years",
    yearNumber: "2nd",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultClassReps("2nd-year", "2", 7),
  },
  {
    id: "3rd-year",
    label: "3rd Years",
    yearNumber: "3rd",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultClassReps("3rd-year", "3", 7),
  },
  {
    id: "4th-year",
    label: "4th Years",
    yearNumber: "4th",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultClassReps("4th-year", "4", 7),
  },
  {
    id: "p-year",
    label: "P Years",
    yearNumber: "P",
    description: "Lorem ipsum dolor sit amet consectetur Lorem ipsum dolor sit amet consectetur",
    sealUrl: "/circle-access-logo.webp",
    representatives: createDefaultClassReps("p-year", "P", 3),
  },
];
