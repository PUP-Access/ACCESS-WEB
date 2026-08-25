"use client";

import { useState, useEffect } from "react";
import OfficersRosterMedia from "@/features/cms/components/OfficersRosterMedia";
import OfficersHierarchyView from "@/features/officers/components/OfficersHierarchyView";
import type { OfficersHierarchyContent } from "@/features/officers/schemas";

type OfficersTabsProps = {
  parts: {
    id: string;
    label: string;
    link: string;
    imageUrl?: string;
  }[];
  hierarchyContent?: OfficersHierarchyContent;
};

export default function OfficersTabs({ parts, hierarchyContent }: OfficersTabsProps) {
  // Find ACCESS tab if available, otherwise first tab
  const accessTab = parts.find((p) => p.label.toLowerCase().includes("access"))?.id;
  const defaultTab = accessTab || (parts.length > 0 ? parts[0].id : "access");
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hash = window.location.hash.replace("#", "");
    if (hash && parts.some((p) => p.id === hash)) {
      setActiveTab(hash);
    } else if (accessTab) {
      setActiveTab(accessTab);
    }
  }, [parts, accessTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (parts.some((p) => p.id === hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [parts]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, "", `#${tab}`);
  };

  if (!mounted) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-[#F26223]" />
      </div>
    );
  }

  // If no parts configured, render the hierarchy directly
  if (parts.length === 0) {
    return <OfficersHierarchyView content={hierarchyContent} />;
  }

  const activePart = parts.find((p) => p.id === activeTab) || parts[0];
  const isAccessTab =
    activePart.label.toLowerCase().includes("access") ||
    (!activePart.imageUrl && parts.length <= 1);

  return (
    <div className="w-full flex flex-col items-center">
      {parts.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 relative z-30">
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => handleTabChange(part.id)}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                activeTab === part.id
                  ? "bg-[#F26223] text-white shadow-[0_8px_24px_rgba(242,98,35,0.4)] scale-105"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {part.label}
            </button>
          ))}
        </div>
      )}

      <div className="w-full relative z-20">
        {isAccessTab ? (
          <OfficersHierarchyView content={hierarchyContent} />
        ) : activePart.imageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_20px_60px_rgba(0,0,0,0.45)] animate-in fade-in zoom-in-95 duration-300">
            <OfficersRosterMedia url={activePart.imageUrl} />
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center text-sm text-white/60 animate-in fade-in duration-300">
            No officers roster uploaded for {activePart.label} yet.
          </div>
        )}
      </div>
    </div>
  );
}
