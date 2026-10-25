import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const paths = [
    "/",
    "/partners",
    "/officers",
    "/officers/class-representatives",
    "/officers/batch-representatives",
    "/contact",
    "/contributors",
  ] as const;

  const entries: Record<(typeof paths)[number], { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = {
    "/": { changeFrequency: "weekly", priority: 1 },
    "/partners": { changeFrequency: "monthly", priority: 0.8 },
    "/officers": { changeFrequency: "weekly", priority: 0.8 },
    "/officers/class-representatives": { changeFrequency: "weekly", priority: 0.6 },
    "/officers/batch-representatives": { changeFrequency: "weekly", priority: 0.6 },
    "/contact": { changeFrequency: "yearly", priority: 0.5 },
    "/contributors": { changeFrequency: "yearly", priority: 0.3 },
  };

  return paths.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    ...entries[path],
  }));
}
