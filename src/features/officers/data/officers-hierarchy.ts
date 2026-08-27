import type { OfficersHierarchyContent } from "../schemas";

export interface OfficerItem {
  id: string;
  name: string;
  displayName?: string;
  role: string;
  courseYear?: string;
  bio?: string;
  hideBio?: boolean;
  email?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  category?: string;
  display_order?: number;
  is_active?: boolean;
}


export interface OfficerTier {
  id: string;
  title?: string;
  officers: OfficerItem[];
}

const DEFAULT_BIO =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export const ACCESS_OFFICERS_TIERS: OfficerTier[] = [
  {
    id: "tier-president",
    officers: [
      {
        id: "tantia-antonio-mickel",
        name: "Tantia, Antonio Mickel",
        displayName: "Antonio Mickel Tantia",
        role: "PRESIDENT",
        courseYear: "BSCPE 4-2",
        bio: DEFAULT_BIO,
        email: "tantia.antonio@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/tantia-antonio-mickel.webp",
      },
    ],
  },
  {
    id: "tier-evp",
    officers: [
      {
        id: "camanso-jewel",
        name: "Camanso, Jewel",
        displayName: "Jewel Camanso",
        role: "EXECUTIVE VICE PRESIDENT",
        courseYear: "BSCPE 4-1",
        bio: DEFAULT_BIO,
        email: "camanso.jewel@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/camanso-jewel.webp",
      },
    ],
  },
  {
    id: "tier-vps",
    officers: [
      {
        id: "gacu-laiza-may",
        name: "Gacu, Laiza May",
        displayName: "Laiza May Gacu",
        role: "VICE PRESIDENT FOR ACADEMIC AFFAIRS",
        courseYear: "BSCPE 3-1",
        bio: DEFAULT_BIO,
        email: "gacu.laiza@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/gacu-laiza-may.webp",
      },
      {
        id: "valencia-zuriel-elijah",
        name: "Valencia, Zuriel Elijah",
        displayName: "Zuriel Elijah Valencia",
        role: "VICE PRESIDENT FOR STUDENT SERVICES",
        courseYear: "BSCPE 3-2",
        bio: DEFAULT_BIO,
        email: "valencia.zuriel@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/valencia-zuriel-elijah.webp",
      },
      {
        id: "gines-julianna",
        name: "Gines, Julianna",
        displayName: "Julianna Gines",
        role: "VICE PRESIDENT FOR ORGANIZATIONAL RELATIONS",
        courseYear: "BSCPE 3-1",
        bio: DEFAULT_BIO,
        email: "gines.julianna@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/gines-julianna.webp",
      },
      {
        id: "zapanta-ren",
        name: "Zapanta, Ren",
        displayName: "Ren Zapanta",
        role: "VICE PRESIDENT FOR RESEARCH AND DEVELOPMENT",
        courseYear: "BSCPE 3-2",
        bio: DEFAULT_BIO,
        email: "zapanta.ren@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/zapanta-ren.webp",
      },
    ],
  },
  {
    id: "tier-core-officers",
    officers: [
      {
        id: "maristela-john-rowie",
        name: "Maristela, John Rowie",
        displayName: "John Rowie Maristela",
        role: "SECRETARY GENERAL",
        courseYear: "BSCPE 2-1",
        bio: DEFAULT_BIO,
        email: "maristela.john@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/maristela-john-rowie.webp",
      },
      {
        id: "layag-jaiquose",
        name: "Layag, Jaiquose",
        displayName: "Jaiquose Layag",
        role: "AUDITOR",
        courseYear: "BSCPE 2-2",
        bio: DEFAULT_BIO,
        email: "layag.jaiquose@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/layag-jaiquose.webp",
      },
      {
        id: "mula-ivan",
        name: "Mula, Ivan",
        displayName: "Ivan Mula",
        role: "CONTROL OFFICER",
        courseYear: "BSCPE 2-1",
        bio: DEFAULT_BIO,
        email: "mula.ivan@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/mula-ivan.webp",
      },
    ],
  },
  {
    id: "tier-heads",
    officers: [
      {
        id: "guillermo-erica",
        name: "Guillermo, Erica",
        displayName: "Erica Guillermo",
        role: "TREASURER",
        courseYear: "BSCPE 2-2",
        bio: DEFAULT_BIO,
        email: "guillermo.erica@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/guillermo-erica.webp",
      },
      {
        id: "villanueva-avecydee-chris",
        name: "Villanueva, Avecydee Chris",
        displayName: "Avecydee Chris Villanueva",
        role: "BUSINESS MANAGER",
        courseYear: "BSCPE 2-1",
        bio: DEFAULT_BIO,
        email: "villanueva.avecydee@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/villanueva-avecydee-chris.webp",
      },
      {
        id: "ador-dionisio-dashiell-john",
        name: "Ador Dionisio, Dashiell John",
        displayName: "Dashiell John Ador Dionisio",
        role: "TECHNICAL HEAD",
        courseYear: "BSCPE 2-2",
        bio: DEFAULT_BIO,
        email: "adordionisio.dashiell@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/ador-dionisio-dashiell-john.webp",
      },
      {
        id: "encanto-tres-inigo",
        name: "Encanto, Tres Iñigo",
        displayName: "Tres Iñigo Encanto",
        role: "MULTIMEDIA HEAD",
        courseYear: "BSCPE 2-1",
        bio: DEFAULT_BIO,
        email: "encanto.tres@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/encanto-tres-inigo.webp",
      },
    ],
  },
  {
    id: "tier-head-governor",
    officers: [
      {
        id: "alba-blessie-jane",
        name: "Alba, Blessie Jane",
        displayName: "Blessie Jane Alba",
        role: "HEAD GOVERNOR",
        courseYear: "BSCPE 4-1",
        bio: DEFAULT_BIO,
        email: "alba.blessie@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/alba-blessie-jane.webp",
      },
    ],
  },
  {
    id: "tier-upper-governors",
    officers: [
      {
        id: "lim-sophia-queen",
        name: "Lim, Sophia Queen",
        displayName: "Sophia Queen Lim",
        role: "4TH YEAR GOVERNOR",
        courseYear: "BSCPE 4-2",
        bio: DEFAULT_BIO,
        email: "lim.sophia@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/lim-sophia-queen.webp",
      },
      {
        id: "ampon-arsher-roey",
        name: "Ampon, Arsher Roey",
        displayName: "Arsher Roey Ampon",
        role: "3RD YEAR GOVERNOR",
        courseYear: "BSCPE 3-1",
        bio: DEFAULT_BIO,
        email: "ampon.arsher@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/ampon-arsher-roey.webp",
      },
      {
        id: "regualos-gren-nathan",
        name: "Regualos, Gren Nathan",
        displayName: "Gren Nathan Regualos",
        role: "2ND YEAR GOVERNOR",
        courseYear: "BSCPE 2-1",
        bio: DEFAULT_BIO,
        email: "regualos.gren@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/regualos-gren-nathan.webp",
      },
    ],
  },
  {
    id: "tier-lower-governors",
    officers: [
      {
        id: "castillejos-mary-lou",
        name: "Castillejos, Mary Lou",
        displayName: "Mary Lou Castillejos",
        role: "1ST YEAR GOVERNOR",
        courseYear: "BSCPE 1-1",
        bio: DEFAULT_BIO,
        email: "castillejos.mary@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/castillejos-mary-lou.webp",
      },
      {
        id: "kinkito-mark-andrei",
        name: "Kinkito, Mark Andrei",
        displayName: "Mark Andrei Kinkito",
        role: "P YEAR GOVERNOR",
        courseYear: "BSCPE P-1",
        bio: DEFAULT_BIO,
        email: "kinkito.mark@access.org",
        facebookUrl: "https://facebook.com",
        linkedinUrl: "https://linkedin.com",
        githubUrl: "https://github.com",
        imageUrl: "/officers/kinkito-mark-andrei.webp",
      },
    ],
  },
];

export const ACCESS_ADVISERS: OfficerItem[] = [
  {
    id: "adviser-1",
    name: "Engr. Florinda H. Oquindo, PCPE",
    displayName: "Engr. Florinda H. Oquindo, PCPE",
    role: "ADVISER",
    courseYear: "CpE Department Faculty",
    bio: DEFAULT_BIO,
    email: "oquindo.florinda@access.org",
    facebookUrl: "https://facebook.com",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
    imageUrl: "/officers/adviser-1.webp",
  },
  {
    id: "adviser-2",
    name: "Engr. Joshua Benjamin B. Rodriguez",
    displayName: "Engr. Joshua Benjamin B. Rodriguez",
    role: "ADVISER",
    courseYear: "CpE Department Faculty",
    bio: DEFAULT_BIO,
    email: "rodriguez.joshua@access.org",
    facebookUrl: "https://facebook.com",
    linkedinUrl: "https://linkedin.com",
    githubUrl: "https://github.com",
    imageUrl: "/officers/adviser-2.webp",
  },
];

export const DEFAULT_OFFICERS_HIERARCHY_CONTENT: OfficersHierarchyContent = {
  tiers: ACCESS_OFFICERS_TIERS.map((tier) => ({
    id: tier.id,
    title: tier.title,
    officers: tier.officers.map((o) => ({
      id: o.id,
      name: o.name,
      displayName: o.displayName || "",
      role: o.role,
      tierId: tier.id,
      courseYear: o.courseYear || "",
      bio: o.bio || "",
      hideBio: o.hideBio || false,
      email: o.email || "",
      facebookUrl: o.facebookUrl || "",
      linkedinUrl: o.linkedinUrl || "",
      githubUrl: o.githubUrl || "",
      imageUrl: o.imageUrl || "",
      bannerUrl: "",
      display_order: 0,
      is_active: true,
    })),
  })),
  advisers: ACCESS_ADVISERS.map((a) => ({
    id: a.id,
    name: a.name,
    displayName: a.displayName || "",
    role: a.role,
    tierId: "advisers",
    courseYear: a.courseYear || "",
    bio: a.bio || "",
    hideBio: a.hideBio || false,
    email: a.email || "",
    facebookUrl: a.facebookUrl || "",
    linkedinUrl: a.linkedinUrl || "",
    githubUrl: a.githubUrl || "",
    imageUrl: a.imageUrl || "",
    bannerUrl: "",
    display_order: 0,
    is_active: true,
  })),
};
