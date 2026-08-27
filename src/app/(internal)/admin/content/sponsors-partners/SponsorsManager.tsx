"use client";

import { useState } from "react";
import Image from "next/image";
import type { SponsorPartnerItem } from "@/features/cms";
import { uploadSponsorLogoAction } from "@/features/cms/actions/cms.actions";

type SponsorsManagerProps = {
  initialItems: SponsorPartnerItem[];
};

export default function SponsorsManager({ initialItems }: SponsorsManagerProps) {
  const [items, setItems] = useState<SponsorPartnerItem[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "sponsor" | "partner">("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<SponsorPartnerItem>>({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    type: "sponsor",
    tier: "standard",
    category: "",
    isVisible: true,
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadSponsorLogoAction(formData);
    setIsUploading(false);

    if (res.success && res.url) {
      setNewItem((prev) => ({ ...prev, logoUrl: res.url }));
    } else {
      setUploadError(res.error || "Failed to upload logo image.");
    }
  };

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;

    const created: SponsorPartnerItem = {
      id: crypto.randomUUID(),
      name: newItem.name.trim(),
      logoUrl: newItem.logoUrl || "",
      websiteUrl: newItem.websiteUrl?.trim() || "",
      type: newItem.type || "sponsor",
      tier: newItem.tier || "standard",
      category: newItem.category?.trim() || "",
      isVisible: newItem.isVisible ?? true,
      orderIndex: items.length + 1,
    };

    setItems((prev) => [...prev, created]);
    setNewItem({
      name: "",
      logoUrl: "",
      websiteUrl: "",
      type: "sponsor",
      tier: "standard",
      category: "",
      isVisible: true,
    });
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setItems(updated);
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Hidden input storing JSON serialization for Form submission */}
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      {/* ── ADD NEW ITEM SECTION ── */}
      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-[#FFB89A]">
          Add New Sponsor or Partner
        </h4>

        {uploadError && (
          <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
            {uploadError}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Organization / Company Name <span className="text-[#F26223]">*</span>
            </label>
            <input
              type="text"
              value={newItem.name || ""}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g. Google Cloud"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Classification
            </label>
            <select
              value={newItem.type || "sponsor"}
              onChange={(e) =>
                setNewItem({ ...newItem, type: e.target.value as "sponsor" | "partner" })
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#F26223] focus:outline-none"
            >
              <option value="sponsor">Sponsor (ACCESS Sponsors)</option>
              <option value="partner">Partner (ACCESS Partners)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Tier / Spotlight
            </label>
            <select
              value={newItem.tier || "standard"}
              onChange={(e) =>
                setNewItem({ ...newItem, tier: e.target.value as "featured" | "standard" })
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-[#F26223] focus:outline-none"
            >
              <option value="standard">Standard Grid Item</option>
              <option value="featured">Featured / Top Spotlight</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Category Tag / Label
            </label>
            <input
              type="text"
              value={newItem.category || ""}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              placeholder="e.g. Co-Presenter, Gold Sponsor, Media"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Website URL (Optional)
            </label>
            <input
              type="url"
              value={newItem.websiteUrl || ""}
              onChange={(e) => setNewItem({ ...newItem, websiteUrl: e.target.value })}
              placeholder="https://company.com"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F26223] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Upload Logo PNG / WEBP
            </label>
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg,image/svg+xml"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="w-full text-xs text-white/60 file:mr-2 file:rounded-lg file:border-0 file:bg-[#F26223]/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FFD4BC] hover:file:bg-[#F26223]/30"
            />
          </div>
        </div>

        {newItem.logoUrl && (
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-white/60">Logo Preview:</span>
            <div className="relative h-10 w-10 rounded-full bg-white p-1 overflow-hidden border border-white/30">
              <Image
                src={newItem.logoUrl}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => setNewItem({ ...newItem, logoUrl: "" })}
              className="text-xs text-rose-400 hover:underline"
            >
              Remove Logo
            </button>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!newItem.name?.trim() || isUploading}
            className="rounded-xl px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "#F26223" }}
          >
            + Add to List
          </button>
        </div>
      </div>

      {/* ── CURRENT ITEMS LIST ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Current Partners & Sponsors ({items.length})
          </h4>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            {(["all", "sponsor", "partner"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  filter === f
                    ? "bg-[#F26223] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {f === "all" ? "All" : `${f}s`}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="text-xs text-white/40 italic p-4 text-center border border-white/10 rounded-xl">
            No entries found in this view. Add one above!
          </p>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const originalIndex = items.findIndex((i) => i.id === item.id);

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                    item.isVisible
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.01] opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Move Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={originalIndex === 0}
                        onClick={() => handleMove(originalIndex, "up")}
                        className="text-white/40 hover:text-white disabled:opacity-20 text-[10px]"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={originalIndex === items.length - 1}
                        onClick={() => handleMove(originalIndex, "down")}
                        className="text-white/40 hover:text-white disabled:opacity-20 text-[10px]"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Logo circular badge preview */}
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-white p-1 overflow-hidden border border-white/20 flex items-center justify-center">
                      {item.logoUrl ? (
                        <Image
                          src={item.logoUrl}
                          alt={item.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-black uppercase">
                          {item.name.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    {/* Name & Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            item.type === "sponsor"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {item.type}
                        </span>
                        {item.tier === "featured" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#F26223]/25 text-[#FFB89A] border border-[#F26223]/40">
                            ★ Featured Spotlight
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-white/50 truncate">
                        {item.category || "No category tag"}{" "}
                        {item.websiteUrl && `• ${item.websiteUrl}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        item.isVisible
                          ? "bg-white/10 text-white/80 hover:bg-white/20"
                          : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                      }`}
                    >
                      {item.isVisible ? "Visible" : "Hidden"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-white/40 hover:bg-rose-500/20 hover:text-rose-300 transition"
                      title="Delete entry"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
