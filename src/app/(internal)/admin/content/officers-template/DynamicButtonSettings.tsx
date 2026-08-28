"use client";

import { useState } from "react";
import { AdminFieldLabel } from "../../components/admin-ui";

type ButtonPart = {
  id: string;
  label: string;
  link: string;
  isVisible?: boolean;
};

type Props = {
  initialParts: ButtonPart[];
};

const SUGGESTED_PRESETS = [
  { label: "ACCESS Officers", link: "/officers" },
  { label: "Class Representatives", link: "/officers/class-representatives" },
  { label: "Batch Representatives", link: "/officers/batch-representatives" },
  { label: "Faculty Advisers", link: "/officers#advisers" },
];

export default function DynamicButtonSettings({ initialParts }: Props) {
  const [parts, setParts] = useState<ButtonPart[]>(
    initialParts.map((p) => ({
      ...p,
      isVisible: p.isVisible !== undefined ? p.isVisible : true,
    }))
  );

  const adminInputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 transition-colors focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223]";

  const adminBtnSecondaryClass =
    "inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#F26223]/50";

  const adminBtnDangerClass =
    "inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 focus:outline-none";

  const handleAddPart = () => {
    setParts([
      ...parts,
      {
        id: `part-${Date.now()}`,
        label: "New Button",
        link: "/officers",
        isVisible: true,
      },
    ]);
  };

  const handleRemovePart = (idToRemove: string) => {
    setParts(parts.filter((p) => p.id !== idToRemove));
  };

  const handleToggleVisibility = (id: string) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          const currentVisible = p.isVisible !== false;
          return { ...p, isVisible: !currentVisible };
        }
        return p;
      })
    );
  };

  const handleChange = (id: string, field: "label" | "link", value: string) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const applyPreset = (id: string, preset: { label: string; link: string }) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          return { ...p, label: preset.label, link: preset.link };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6">
      <input type="hidden" name="partsJson" value={JSON.stringify(parts)} />

      {parts.map((part, index) => {
        const isVisible = part.isVisible !== false;

        return (
          <div
            key={part.id}
            className={`pt-6 border-t border-white/10 first:pt-4 first:border-0 relative group p-4 rounded-2xl transition-all duration-200 ${
              isVisible
                ? "bg-neutral-950/40 border border-white/10"
                : "bg-neutral-950/80 border border-white/5 opacity-75"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-bold text-white">Button {index + 1} Settings</h4>
                {!isVisible && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Hidden from Website
                  </span>
                )}
              </div>

              {/* Action buttons: Visibility Toggle & Remove */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(part.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 ${
                    isVisible
                      ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 shadow-sm"
                      : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"
                  }`}
                  title={isVisible ? "Click to hide from Landing Page" : "Click to show on Landing Page"}
                >
                  <span>{isVisible ? "Visible" : "Hidden"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemovePart(part.id)}
                  className={adminBtnDangerClass}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <AdminFieldLabel>Label</AdminFieldLabel>
                <input
                  value={part.label}
                  onChange={(e) => handleChange(part.id, "label", e.target.value)}
                  placeholder="e.g. Class Representatives"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Link / Target URL</AdminFieldLabel>
                <input
                  value={part.link}
                  onChange={(e) => handleChange(part.id, "link", e.target.value)}
                  placeholder="e.g. /officers/class-representatives"
                  className={adminInputClass}
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
              {SUGGESTED_PRESETS.map((preset) => (
                <button
                  key={preset.link}
                  type="button"
                  onClick={() => applyPreset(part.id, preset)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:bg-[#F26223]/20 hover:border-[#F26223]/40 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-white/10 flex justify-center">
        <button
          type="button"
          onClick={handleAddPart}
          className={adminBtnSecondaryClass}
        >
          + Add another button
        </button>
      </div>
    </div>
  );
}
