"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import type {
  OfficerHierarchyItemInput,
  OfficersHierarchyContent,
  ClassRepItemInput,
  ClassRepsContent,
  BatchRepItemInput,
  BatchRepsContent,
} from "@/features/officers/schemas";
import {
  saveOfficerHierarchyAction,
  deleteOfficerHierarchyAction,
} from "@/features/officers/actions/officers-hierarchy.actions";
import {
  saveClassRepAction,
  deleteClassRepAction,
} from "@/features/officers/actions/class-reps.actions";
import {
  saveBatchRepAction,
  deleteBatchRepAction,
} from "@/features/officers/actions/batch-reps.actions";
import {
  AdminPageHeader,
  AdminFieldLabel,
  adminBtnPrimaryClass,
  adminBtnSecondaryClass,
  adminInputClass,
  adminTextareaClass,
  adminFileClass,
} from "../components/admin-ui";

interface AdminOfficersManagerProps {
  initialContent: OfficersHierarchyContent;
  initialClassReps?: ClassRepsContent;
  initialBatchReps?: BatchRepsContent;
}

// ── TIER & BATCH CONSTANTS ───────────────────────────────────────────────
const ACCESS_TIER_GROUPS = [
  { id: "all", label: "All Tiers" },
  { id: "executives", label: "Executive Board", tierIds: ["tier-president", "tier-evp", "tier-vps"] },
  { id: "vps", label: "Vice Presidents", tierIds: ["tier-vps"] },
  { id: "core-heads", label: "Core & Head Officers", tierIds: ["tier-core-officers", "tier-heads"] },
  { id: "governors", label: "Governors", tierIds: ["tier-head-governor", "tier-upper-governors", "tier-lower-governors"] },
  { id: "advisers", label: "Advisers", tierIds: ["advisers"] },
];

const ACCESS_TIER_OPTIONS = [
  { id: "tier-president", label: "President", badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "tier-evp", label: "Executive Vice President", badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  { id: "tier-vps", label: "Vice Presidents", badgeColor: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
  { id: "tier-core-officers", label: "Core Officers (SecGen, Auditor, Control)", badgeColor: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
  { id: "tier-heads", label: "Head Officers (Treasurer, BM, Tech, Multimedia)", badgeColor: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
  { id: "tier-head-governor", label: "Head Governor", badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" },
  { id: "tier-upper-governors", label: "Year Governors (4th, 3rd, 2nd Year)", badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  { id: "tier-lower-governors", label: "Lower Year Governors (1st, P Year)", badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { id: "advisers", label: "ACCESS Advisers", badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
];

const CLASS_REP_YEAR_OPTIONS = [
  { id: "1st-year", label: "1st Years", badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { id: "2nd-year", label: "2nd Years", badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  { id: "3rd-year", label: "3rd Years", badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" },
  { id: "4th-year", label: "4th Years", badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { id: "p-year", label: "P Years", badgeColor: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
];

const BATCH_REP_OPTIONS = [
  { id: "1st-year", label: "1st Years", badgeColor: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  { id: "2nd-year", label: "2nd Years", badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  { id: "3rd-year", label: "3rd Years", badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" },
  { id: "4th-year", label: "4th Years", badgeColor: "border-purple-500/40 bg-purple-500/10 text-purple-300" },
  { id: "p-year", label: "P Years", badgeColor: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
];

const BATCH_ROLE_PRESETS = [
  "PRESIDENT",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Auditor",
  "PIO",
  "Logistic Head",
];

const LAVA_BANNER_BG = `
  linear-gradient(38deg,
    transparent 27%, rgba(255,175,10,0.95) 29.5%, rgba(255,225,65,1) 30.5%,
    rgba(255,175,10,0.95) 31.5%, transparent 34%),
  linear-gradient(56deg,
    transparent 44%, rgba(230,95,0,0.85) 46%, rgba(255,148,0,0.95) 47%,
    rgba(230,95,0,0.85) 48%, transparent 50%),
  linear-gradient(130deg,
    transparent 54%, rgba(255,130,0,0.75) 56%, rgba(255,185,30,0.85) 57%,
    rgba(255,130,0,0.75) 58%, transparent 60%),
  linear-gradient(170deg,
    transparent 34%, rgba(200,55,0,0.60) 36%, rgba(240,110,10,0.70) 37%,
    transparent 39%),
  linear-gradient(-15deg,
    transparent 58%, rgba(195,50,0,0.65) 60%, rgba(245,115,5,0.75) 61%,
    transparent 63%),
  radial-gradient(ellipse at 22% 52%, rgba(255,110,0,0.80) 0%, transparent 38%),
  radial-gradient(ellipse at 75% 22%, rgba(210,65,0,0.70) 0%, transparent 32%),
  radial-gradient(ellipse at 60% 82%, rgba(185,40,0,0.60) 0%, transparent 30%),
  radial-gradient(ellipse at 10% 78%, rgba(235,95,0,0.60) 0%, transparent 28%),
  radial-gradient(ellipse at 88% 65%, rgba(255,145,15,0.55) 0%, transparent 26%),
  linear-gradient(145deg, #100200 0%, #2a0501 35%, #140300 65%, #300803 100%)
`;

function StatCard({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  accent: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-card group relative overflow-hidden rounded-2xl p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] w-full border ${
        active ? "border-[#F26223] ring-1 ring-[#F26223]" : "border-white/10"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
        style={{ background: accent }}
      />
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="title-header mt-3 text-4xl font-extrabold">{value}</p>
      <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
        Open →
      </p>
    </button>
  );
}

export default function AdminOfficersManager({
  initialContent,
  initialClassReps = [],
  initialBatchReps = [],
}: AdminOfficersManagerProps) {
  const router = useRouter();

  // Top Master Category: ACCESS Officers | Class Representatives | Batch Representatives
  const [masterTab, setMasterTab] = useState<"access" | "class-reps" | "batch-reps">("access");

  // State for ACCESS Officers
  const [content, setContent] = useState<OfficersHierarchyContent>(initialContent);
  const [editingOfficer, setEditingOfficer] = useState<OfficerHierarchyItemInput | null>(null);

  // State for Class Reps
  const [classReps, setClassReps] = useState<ClassRepsContent>(initialClassReps);
  const [editingClassRep, setEditingClassRep] = useState<ClassRepItemInput | null>(null);

  // State for Batch Reps
  const [batchReps, setBatchReps] = useState<BatchRepsContent>(initialBatchReps);
  const [editingBatchRep, setEditingBatchRep] = useState<BatchRepItemInput | null>(null);

  // Shared Preview & UI State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    name: string;
    type: "access" | "class-reps" | "batch-reps";
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filter & Search states
  const [selectedAccessGroup, setSelectedAccessGroup] = useState<string>("all");
  const [selectedClassYear, setSelectedClassYear] = useState<string>("all");
  const [selectedBatchCohort, setSelectedBatchCohort] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  // ── 1. ACCESS OFFICERS CALCULATIONS ──────────────────────────────────────
  const totalOfficersCount = useMemo(() => {
    let count = 0;
    for (const t of content.tiers) count += t.officers.length;
    return count;
  }, [content]);

  const execCount = useMemo(() => {
    let count = 0;
    const execTiers = ["tier-president", "tier-evp", "tier-vps"];
    for (const t of content.tiers) {
      if (execTiers.includes(t.id)) count += t.officers.length;
    }
    return count;
  }, [content]);

  const coreHeadsCount = useMemo(() => {
    let count = 0;
    const chTiers = ["tier-core-officers", "tier-heads"];
    for (const t of content.tiers) {
      if (chTiers.includes(t.id)) count += t.officers.length;
    }
    return count;
  }, [content]);

  const governorsCount = useMemo(() => {
    let count = 0;
    const govTiers = ["tier-head-governor", "tier-upper-governors", "tier-lower-governors"];
    for (const t of content.tiers) {
      if (govTiers.includes(t.id)) count += t.officers.length;
    }
    return count;
  }, [content]);

  const totalAdvisersCount = content.advisers?.length || 0;
  const totalPersonnel = totalOfficersCount + totalAdvisersCount;

  const allAccessOfficersList = useMemo(() => {
    const list: (OfficerHierarchyItemInput & { tierLabel: string; badgeColor: string })[] = [];

    for (const tier of content.tiers) {
      const tierConfig = ACCESS_TIER_OPTIONS.find((t) => t.id === tier.id);
      for (const officer of tier.officers) {
        list.push({
          ...officer,
          tierId: tier.id,
          tierLabel: tierConfig?.label || tier.id,
          badgeColor: tierConfig?.badgeColor || "border-white/20 bg-white/5 text-zinc-300",
        });
      }
    }

    for (const adviser of content.advisers || []) {
      const tierConfig = ACCESS_TIER_OPTIONS.find((t) => t.id === "advisers");
      list.push({
        ...adviser,
        tierId: "advisers",
        tierLabel: "Adviser",
        badgeColor: tierConfig?.badgeColor || "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      });
    }

    return list;
  }, [content]);

  const filteredAccessOfficers = useMemo(() => {
    return allAccessOfficersList.filter((item) => {
      if (selectedAccessGroup !== "all") {
        const group = ACCESS_TIER_GROUPS.find((g) => g.id === selectedAccessGroup);
        if (group?.tierIds && !group.tierIds.includes(item.tierId)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.displayName?.toLowerCase().includes(q) ||
          item.role.toLowerCase().includes(q) ||
          item.courseYear?.toLowerCase().includes(q) ||
          item.tierLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allAccessOfficersList, selectedAccessGroup, searchQuery]);

  // ── 2. CLASS REPS CALCULATIONS ───────────────────────────────────────────
  const allClassRepsList = useMemo(() => {
    const list: (ClassRepItemInput & { yearLabel: string; badgeColor: string })[] = [];
    for (const year of classReps) {
      const config = CLASS_REP_YEAR_OPTIONS.find((c) => c.id === year.id);
      for (const rep of year.representatives) {
        list.push({
          ...rep,
          yearId: year.id,
          yearLabel: config?.label || year.label,
          badgeColor: config?.badgeColor || "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
        });
      }
    }
    return list;
  }, [classReps]);

  const filteredClassReps = useMemo(() => {
    return allClassRepsList.filter((item) => {
      if (selectedClassYear !== "all") {
        if (selectedClassYear === "upper-and-p") {
          if (!["3rd-year", "4th-year", "p-year"].includes(item.yearId)) return false;
        } else if (item.yearId !== selectedClassYear) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.displayName?.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.yearLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allClassRepsList, selectedClassYear, searchQuery]);

  // ── 3. BATCH REPS CALCULATIONS ───────────────────────────────────────────
  const allBatchRepsList = useMemo(() => {
    const list: (BatchRepItemInput & { batchLabel: string; badgeColor: string })[] = [];
    for (const batch of batchReps) {
      const config = BATCH_REP_OPTIONS.find((b) => b.id === batch.id);
      for (const rep of batch.representatives) {
        list.push({
          ...rep,
          batchId: batch.id,
          batchLabel: config?.label || batch.label,
          badgeColor: config?.badgeColor || "border-amber-500/40 bg-amber-500/10 text-amber-300",
        });
      }
    }
    return list;
  }, [batchReps]);

  const filteredBatchReps = useMemo(() => {
    return allBatchRepsList.filter((item) => {
      if (selectedBatchCohort !== "all") {
        if (selectedBatchCohort === "upper-and-p") {
          if (!["3rd-year", "4th-year", "p-year"].includes(item.batchId)) return false;
        } else if (item.batchId !== selectedBatchCohort) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.displayName?.toLowerCase().includes(q) ||
          item.role.toLowerCase().includes(q) ||
          item.batchYear?.toLowerCase().includes(q) ||
          item.courseYear?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allBatchRepsList, selectedBatchCohort, searchQuery]);

  // ── HANDLERS ─────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setPreviewImage(null);
    setPreviewBanner(null);
    setIsNew(true);
    setFeedback(null);

    if (masterTab === "access") {
      setEditingOfficer({
        id: crypto.randomUUID(),
        name: "",
        displayName: "",
        role: "",
        tierId: "tier-president",
        courseYear: "",
        bio: "",
        hideBio: false,
        email: "",
        facebookUrl: "",
        linkedinUrl: "",
        githubUrl: "",
        imageUrl: "",
        bannerUrl: "",
        display_order: 0,
        is_active: true,
      });
    } else if (masterTab === "class-reps") {
      setEditingClassRep({
        id: crypto.randomUUID(),
        name: "",
        displayName: "",
        role: "CLASS REPRESENTATIVE",
        yearId: "1st-year",
        section: "BSCPE 1-1",
        courseYear: "BSCPE 1-1",
        bio: "",
        hideBio: false,
        email: "",
        facebookUrl: "",
        linkedinUrl: "",
        githubUrl: "",
        imageUrl: "",
        bannerUrl: "",
        display_order: 0,
        is_active: true,
      });
    } else if (masterTab === "batch-reps") {
      setEditingBatchRep({
        id: crypto.randomUUID(),
        name: "",
        displayName: "",
        role: "PRESIDENT",
        batchId: "1st-year",
        batchYear: "1st Year",
        courseYear: "BSCPE 1-1",
        bio: "",
        hideBio: false,
        email: "",
        facebookUrl: "",
        linkedinUrl: "",
        githubUrl: "",
        imageUrl: "",
        bannerUrl: "",
        display_order: 0,
        is_active: true,
      });
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewImage(URL.createObjectURL(file));
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewBanner(URL.createObjectURL(file));
  };

  // Submit ACCESS Officer
  const handleAccessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOfficer) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", editingOfficer.id);
    formData.set("hideBio", editingOfficer.hideBio ? "true" : "false");

    startTransition(async () => {
      const res = await saveOfficerHierarchyAction({ status: "idle" }, formData);
      if (res.status === "success") {
        setFeedback({ type: "success", message: res.message || "Officer updated successfully" });
        if (res.data) setContent(res.data);
        setEditingOfficer(null);
        setPreviewImage(null);
        setPreviewBanner(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to save officer" });
      }
    });
  };

  // Submit Class Rep
  const handleClassRepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClassRep) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", editingClassRep.id);
    formData.set("hideBio", editingClassRep.hideBio ? "true" : "false");

    startTransition(async () => {
      const res = await saveClassRepAction({ status: "idle" }, formData);
      if (res.status === "success") {
        setFeedback({ type: "success", message: res.message || "Class Rep saved successfully" });
        if (res.data) setClassReps(res.data);
        setEditingClassRep(null);
        setPreviewImage(null);
        setPreviewBanner(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to save class rep" });
      }
    });
  };

  // Submit Batch Rep
  const handleBatchRepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBatchRep) return;
    const formData = new FormData(e.currentTarget);
    formData.set("id", editingBatchRep.id);
    formData.set("hideBio", editingBatchRep.hideBio ? "true" : "false");

    startTransition(async () => {
      const res = await saveBatchRepAction({ status: "idle" }, formData);
      if (res.status === "success") {
        setFeedback({ type: "success", message: res.message || "Batch Officer saved successfully" });
        if (res.data) setBatchReps(res.data);
        setEditingBatchRep(null);
        setPreviewImage(null);
        setPreviewBanner(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to save batch officer" });
      }
    });
  };

  // Delete Handlers
  const handleDeleteAccess = (id: string, name: string) => {
    setDeletingItem({ id, name, type: "access" });
  };

  const handleDeleteClassRep = (id: string, name: string) => {
    setDeletingItem({ id, name, type: "class-reps" });
  };

  const handleDeleteBatchRep = (id: string, name: string) => {
    setDeletingItem({ id, name, type: "batch-reps" });
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    const { id, name, type } = deletingItem;
    setDeletingItem(null);

    startTransition(async () => {
      if (type === "access") {
        const res = await deleteOfficerHierarchyAction({ status: "idle" }, id);
        if (res.status === "success") {
          setFeedback({ type: "success", message: `Deleted ${name}` });
          if (res.data) setContent(res.data);
          router.refresh();
        }
      } else if (type === "class-reps") {
        const res = await deleteClassRepAction({ status: "idle" }, id);
        if (res.status === "success") {
          setFeedback({ type: "success", message: `Deleted ${name}` });
          if (res.data) setClassReps(res.data);
          router.refresh();
        }
      } else if (type === "batch-reps") {
        const res = await deleteBatchRepAction({ status: "idle" }, id);
        if (res.status === "success") {
          setFeedback({ type: "success", message: `Deleted ${name}` });
          if (res.data) setBatchReps(res.data);
          router.refresh();
        }
      }
    });
  };

  const currentAvatarSrc =
    previewImage ||
    editingOfficer?.imageUrl ||
    editingClassRep?.imageUrl ||
    editingBatchRep?.imageUrl ||
    "";

  return (
    <div className="space-y-8">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <AdminPageHeader
        eyebrow="Command Center"
        title="Edit Officers & Representatives"
        description="Manage leadership tiers, class representatives, and batch cohort officers displayed across the platform."
        action={
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-xl bg-[#F26223] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#d9531e]"
          >
            <span className="text-base leading-none">+</span>
            <span>
              {masterTab === "access"
                ? "Add Officer"
                : masterTab === "class-reps"
                ? "Add Class Rep"
                : "Add Batch Officer"}
            </span>
          </button>
        }
      />

      {/* ── Top Master Switcher: ACCESS vs Class Reps vs Batch Reps ─── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            setMasterTab("access");
            setSearchQuery("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
            masterTab === "access"
              ? "bg-[#F26223] text-white shadow-[0_4px_16px_rgba(242,98,35,0.4)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>🏢</span>
          <span>ACCESS Officers ({totalPersonnel})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMasterTab("class-reps");
            setSearchQuery("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
            masterTab === "class-reps"
              ? "bg-[#F26223] text-white shadow-[0_4px_16px_rgba(242,98,35,0.4)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>🎓</span>
          <span>Class Representatives ({allClassRepsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMasterTab("batch-reps");
            setSearchQuery("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
            masterTab === "batch-reps"
              ? "bg-[#F26223] text-white shadow-[0_4px_16px_rgba(242,98,35,0.4)]"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>👥</span>
          <span>Batch Officers ({allBatchRepsList.length})</span>
        </button>
      </div>

      {/* ── Feedback Alert ────────────────────────────────────────── */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-semibold shadow-lg animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40"
              : "bg-rose-950/80 border-rose-500/50 text-rose-200 shadow-rose-950/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{feedback.type === "success" ? "✓" : "⚠"}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-white/60 hover:text-white text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ACCESS OFFICERS SECTION                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {masterTab === "access" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary StatCards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Officers"
              value={totalPersonnel}
              accent="#F26223"
              active={selectedAccessGroup === "all"}
              onClick={() => setSelectedAccessGroup("all")}
            />
            <StatCard
              label="Executive Board"
              value={execCount}
              accent="#FFB800"
              active={selectedAccessGroup === "executives"}
              onClick={() => setSelectedAccessGroup("executives")}
            />
            <StatCard
              label="Core & Head Officers"
              value={coreHeadsCount}
              accent="#10B981"
              active={selectedAccessGroup === "core-heads"}
              onClick={() => setSelectedAccessGroup("core-heads")}
            />
            <StatCard
              label="Governors"
              value={governorsCount}
              accent="#FF8C00"
              active={selectedAccessGroup === "governors"}
              onClick={() => setSelectedAccessGroup("governors")}
            />
          </section>

          {/* Controls Bar: Filter Pills + Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur-xl">
              {ACCESS_TIER_GROUPS.map((group) => {
                const isActive = selectedAccessGroup === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedAccessGroup(group.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#F26223] text-white shadow-[0_4px_14px_rgba(242,98,35,0.35)]"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[260px] sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search officers..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-9 pr-8 text-xs text-white placeholder:text-white/40 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Officer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAccessOfficers.map((officer) => (
              <OfficerCardAdmin
                key={officer.id}
                item={{
                  id: officer.id,
                  name: officer.displayName || officer.name,
                  role: officer.role,
                  courseYear: officer.courseYear,
                  badgeLabel: officer.tierLabel,
                  badgeColor: officer.badgeColor,
                  bio: officer.bio,
                  hideBio: officer.hideBio,
                  imageUrl: officer.imageUrl,
                  facebookUrl: officer.facebookUrl,
                  email: officer.email,
                  linkedinUrl: officer.linkedinUrl,
                  githubUrl: officer.githubUrl,
                }}
                onEdit={() => {
                  setEditingOfficer({ ...officer });
                  setPreviewImage(null);
                  setPreviewBanner(null);
                  setIsNew(false);
                }}
                onDelete={() => handleDeleteAccess(officer.id, officer.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CLASS REPRESENTATIVES SECTION                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {masterTab === "class-reps" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary StatCards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Class Reps"
              value={allClassRepsList.length}
              accent="#F26223"
              active={selectedClassYear === "all"}
              onClick={() => setSelectedClassYear("all")}
            />
            <StatCard
              label="1st Years"
              value={allClassRepsList.filter((r) => r.yearId === "1st-year").length}
              accent="#06B6D4"
              active={selectedClassYear === "1st-year"}
              onClick={() => setSelectedClassYear("1st-year")}
            />
            <StatCard
              label="2nd Years"
              value={allClassRepsList.filter((r) => r.yearId === "2nd-year").length}
              accent="#3B82F6"
              active={selectedClassYear === "2nd-year"}
              onClick={() => setSelectedClassYear("2nd-year")}
            />
            <StatCard
              label="Upper & P Years"
              value={allClassRepsList.filter((r) => ["3rd-year", "4th-year", "p-year"].includes(r.yearId)).length}
              accent="#A855F7"
              active={selectedClassYear === "upper-and-p"}
              onClick={() => setSelectedClassYear("upper-and-p")}
            />
          </section>

          {/* Controls Bar: Filter Pills + Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setSelectedClassYear("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  selectedClassYear === "all"
                    ? "bg-[#F26223] text-white shadow-[0_4px_14px_rgba(242,98,35,0.35)]"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                All Years
              </button>
              {CLASS_REP_YEAR_OPTIONS.map((opt) => {
                const isActive = selectedClassYear === opt.id;
                const count = allClassRepsList.filter((r) => r.yearId === opt.id).length;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedClassYear(opt.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#F26223] text-white shadow-[0_4px_14px_rgba(242,98,35,0.35)]"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[260px] sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search class reps..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-9 pr-8 text-xs text-white placeholder:text-white/40 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClassReps.map((rep) => (
              <OfficerCardAdmin
                key={rep.id}
                item={{
                  id: rep.id,
                  name: rep.displayName || rep.name,
                  role: rep.role,
                  courseYear: rep.section,
                  badgeLabel: rep.yearLabel,
                  badgeColor: rep.badgeColor,
                  bio: rep.bio,
                  hideBio: rep.hideBio,
                  imageUrl: rep.imageUrl,
                  facebookUrl: rep.facebookUrl,
                  email: rep.email,
                  linkedinUrl: rep.linkedinUrl,
                  githubUrl: rep.githubUrl,
                }}
                onEdit={() => {
                  setEditingClassRep({ ...rep });
                  setPreviewImage(null);
                  setPreviewBanner(null);
                  setIsNew(false);
                }}
                onDelete={() => handleDeleteClassRep(rep.id, rep.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. BATCH REPRESENTATIVES / OFFICERS SECTION                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {masterTab === "batch-reps" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary StatCards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Batch Officers"
              value={allBatchRepsList.length}
              accent="#F26223"
              active={selectedBatchCohort === "all"}
              onClick={() => setSelectedBatchCohort("all")}
            />
            <StatCard
              label="1st Years"
              value={allBatchRepsList.filter((b) => b.batchId === "1st-year").length}
              accent="#06B6D4"
              active={selectedBatchCohort === "1st-year"}
              onClick={() => setSelectedBatchCohort("1st-year")}
            />
            <StatCard
              label="2nd Years"
              value={allBatchRepsList.filter((b) => b.batchId === "2nd-year").length}
              accent="#3B82F6"
              active={selectedBatchCohort === "2nd-year"}
              onClick={() => setSelectedBatchCohort("2nd-year")}
            />
            <StatCard
              label="Upper & P Years"
              value={allBatchRepsList.filter((b) => ["3rd-year", "4th-year", "p-year"].includes(b.batchId)).length}
              accent="#A855F7"
              active={selectedBatchCohort === "upper-and-p"}
              onClick={() => setSelectedBatchCohort("upper-and-p")}
            />
          </section>

          {/* Controls Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setSelectedBatchCohort("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  selectedBatchCohort === "all"
                    ? "bg-[#F26223] text-white shadow-[0_4px_14px_rgba(242,98,35,0.35)]"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                All Years
              </button>
              {BATCH_REP_OPTIONS.map((opt) => {
                const isActive = selectedBatchCohort === opt.id;
                const count = allBatchRepsList.filter((b) => b.batchId === opt.id).length;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBatchCohort(opt.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#F26223] text-white shadow-[0_4px_14px_rgba(242,98,35,0.35)]"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[260px] sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch officers..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-9 pr-8 text-xs text-white placeholder:text-white/40 focus:border-[#F26223] focus:outline-none focus:ring-1 focus:ring-[#F26223]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBatchReps.map((rep) => (
              <OfficerCardAdmin
                key={rep.id}
                item={{
                  id: rep.id,
                  name: rep.displayName || rep.name,
                  role: rep.role,
                  courseYear: rep.courseYear,
                  badgeLabel: rep.batchLabel,
                  badgeColor: rep.badgeColor,
                  bio: rep.bio,
                  hideBio: rep.hideBio,
                  imageUrl: rep.imageUrl,
                  facebookUrl: rep.facebookUrl,
                  email: rep.email,
                  linkedinUrl: rep.linkedinUrl,
                  githubUrl: rep.githubUrl,
                }}
                onEdit={() => {
                  setEditingBatchRep({ ...rep });
                  setPreviewImage(null);
                  setPreviewBanner(null);
                  setIsNew(false);
                }}
                onDelete={() => handleDeleteBatchRep(rep.id, rep.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODALS FOR EDITING (ACCESS, CLASS REPS, BATCH REPS)        */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 4A. ACCESS OFFICER MODAL */}
      {editingOfficer && (
        <EditModalShell
          title={isNew ? "Add New Officer" : `Edit Officer: ${editingOfficer.name}`}
          onClose={() => setEditingOfficer(null)}
          onSubmit={handleAccessSubmit}
          isPending={isPending}
          previewBanner={previewBanner || editingOfficer.bannerUrl}
          currentAvatarSrc={currentAvatarSrc}
          displayName={editingOfficer.displayName || editingOfficer.name}
          role={editingOfficer.role}
          courseYear={editingOfficer.courseYear}
          bio={editingOfficer.bio}
          hideBio={editingOfficer.hideBio}
          facebookUrl={editingOfficer.facebookUrl}
          email={editingOfficer.email}
          linkedinUrl={editingOfficer.linkedinUrl}
          githubUrl={editingOfficer.githubUrl}
        >
          <input type="hidden" name="id" value={editingOfficer.id} />
          <input type="hidden" name="imageUrl" value={editingOfficer.imageUrl || ""} />
          <input type="hidden" name="bannerUrl" value={editingOfficer.bannerUrl || ""} />

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F26223]">
              1. Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel>Roster Name (Last, First Middle)*</AdminFieldLabel>
                <input
                  name="name"
                  required
                  value={editingOfficer.name || ""}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="e.g. Tantia, Antonio Mickel"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Display Name (for Modal Popup)</AdminFieldLabel>
                <input
                  name="displayName"
                  value={editingOfficer.displayName || ""}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, displayName: e.target.value } : null))
                  }
                  placeholder="e.g. Antonio Mickel Tantia"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Role / Position Title*</AdminFieldLabel>
                <input
                  name="role"
                  required
                  value={editingOfficer.role || ""}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, role: e.target.value } : null))
                  }
                  placeholder="e.g. PRESIDENT"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Course & Year / Section</AdminFieldLabel>
                <input
                  name="courseYear"
                  value={editingOfficer.courseYear || ""}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, courseYear: e.target.value } : null))
                  }
                  placeholder="e.g. BSCPE 4-2"
                  className={adminInputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <AdminFieldLabel>Leadership Tier / Category*</AdminFieldLabel>
                <select
                  name="tierId"
                  value={editingOfficer.tierId || ""}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, tierId: e.target.value } : null))
                  }
                  className={adminInputClass}
                >
                  {ACCESS_TIER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Media */}
          <MediaUploadFields
            onImageChange={handleImageFileChange}
            onBannerChange={handleBannerFileChange}
          />

          {/* Contact & Socials */}
          <SocialLinksFields
            email={editingOfficer.email}
            facebookUrl={editingOfficer.facebookUrl}
            linkedinUrl={editingOfficer.linkedinUrl}
            githubUrl={editingOfficer.githubUrl}
            onChange={(field, val) =>
              setEditingOfficer((prev) => (prev ? { ...prev, [field]: val } : null))
            }
          />

          {/* Bio */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <AdminFieldLabel>4. Bio / Description</AdminFieldLabel>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hideBio"
                  checked={Boolean(editingOfficer.hideBio)}
                  onChange={(e) =>
                    setEditingOfficer((prev) => (prev ? { ...prev, hideBio: e.target.checked } : null))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#F26223] focus:ring-[#F26223] accent-[#F26223]"
                />
                <span className="text-xs font-semibold text-zinc-300">Hide Bio / Description</span>
              </label>
            </div>
            <textarea
              name="bio"
              rows={3}
              value={editingOfficer.bio ?? ""}
              onChange={(e) =>
                setEditingOfficer((prev) => (prev ? { ...prev, bio: e.target.value } : null))
              }
              placeholder="Enter a brief bio (leave empty to hide automatically)..."
              className={`${adminTextareaClass} ${editingOfficer.hideBio ? "opacity-40" : ""}`}
              disabled={editingOfficer.hideBio}
            />
            <p className="text-[11px] text-zinc-500">
              {editingOfficer.hideBio
                ? "Bio is explicitly hidden on all cards and popup modals."
                : "If left empty, the bio section will automatically hide."}
            </p>
          </div>
        </EditModalShell>
      )}

      {/* 4B. CLASS REP MODAL */}
      {editingClassRep && (
        <EditModalShell
          title={isNew ? "Add New Class Representative" : `Edit Class Rep: ${editingClassRep.name}`}
          onClose={() => setEditingClassRep(null)}
          onSubmit={handleClassRepSubmit}
          isPending={isPending}
          previewBanner={previewBanner || editingClassRep.bannerUrl}
          currentAvatarSrc={currentAvatarSrc}
          displayName={editingClassRep.displayName || editingClassRep.name}
          role={editingClassRep.role}
          courseYear={editingClassRep.section}
          bio={editingClassRep.bio}
          hideBio={editingClassRep.hideBio}
          facebookUrl={editingClassRep.facebookUrl}
          email={editingClassRep.email}
          linkedinUrl={editingClassRep.linkedinUrl}
          githubUrl={editingClassRep.githubUrl}
        >
          <input type="hidden" name="id" value={editingClassRep.id} />
          <input type="hidden" name="imageUrl" value={editingClassRep.imageUrl || ""} />
          <input type="hidden" name="bannerUrl" value={editingClassRep.bannerUrl || ""} />

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F26223]">
              1. Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel>Representative Name (Last, First)*</AdminFieldLabel>
                <input
                  name="name"
                  required
                  value={editingClassRep.name || ""}
                  onChange={(e) =>
                    setEditingClassRep((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="e.g. Tantia, Antonio Mickel"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Display Name</AdminFieldLabel>
                <input
                  name="displayName"
                  value={editingClassRep.displayName || ""}
                  onChange={(e) =>
                    setEditingClassRep((prev) => (prev ? { ...prev, displayName: e.target.value } : null))
                  }
                  placeholder="e.g. Antonio Mickel Tantia"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Year Level*</AdminFieldLabel>
                <select
                  name="yearId"
                  value={editingClassRep.yearId || ""}
                  onChange={(e) =>
                    setEditingClassRep((prev) => (prev ? { ...prev, yearId: e.target.value } : null))
                  }
                  className={adminInputClass}
                >
                  {CLASS_REP_YEAR_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <AdminFieldLabel>Class Section (e.g. BSCPE 1-1)*</AdminFieldLabel>
                <input
                  name="section"
                  required
                  value={editingClassRep.section || ""}
                  onChange={(e) =>
                    setEditingClassRep((prev) => (prev ? { ...prev, section: e.target.value } : null))
                  }
                  placeholder="e.g. BSCPE 1-1"
                  className={adminInputClass}
                />
              </div>
            </div>
          </div>

          <MediaUploadFields
            onImageChange={handleImageFileChange}
            onBannerChange={handleBannerFileChange}
          />

          <SocialLinksFields
            email={editingClassRep.email}
            facebookUrl={editingClassRep.facebookUrl}
            linkedinUrl={editingClassRep.linkedinUrl}
            githubUrl={editingClassRep.githubUrl}
            onChange={(field, val) =>
              setEditingClassRep((prev) => (prev ? { ...prev, [field]: val } : null))
            }
          />

          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <AdminFieldLabel>4. Bio / Description</AdminFieldLabel>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hideBio"
                  checked={Boolean(editingClassRep.hideBio)}
                  onChange={(e) =>
                    setEditingClassRep((prev) => (prev ? { ...prev, hideBio: e.target.checked } : null))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#F26223] focus:ring-[#F26223] accent-[#F26223]"
                />
                <span className="text-xs font-semibold text-zinc-300">Hide Bio / Description</span>
              </label>
            </div>
            <textarea
              name="bio"
              rows={3}
              value={editingClassRep.bio ?? ""}
              onChange={(e) =>
                setEditingClassRep((prev) => (prev ? { ...prev, bio: e.target.value } : null))
              }
              placeholder="Enter description (leave empty to hide automatically)..."
              className={`${adminTextareaClass} ${editingClassRep.hideBio ? "opacity-40" : ""}`}
              disabled={editingClassRep.hideBio}
            />
            <p className="text-[11px] text-zinc-500">
              {editingClassRep.hideBio
                ? "Bio is explicitly hidden on all cards and popup modals."
                : "If left empty, the bio section will automatically hide."}
            </p>
          </div>
        </EditModalShell>
      )}

      {/* 4C. BATCH OFFICER MODAL */}
      {editingBatchRep && (
        <EditModalShell
          title={isNew ? "Add New Batch Officer" : `Edit Batch Officer: ${editingBatchRep.name}`}
          onClose={() => setEditingBatchRep(null)}
          onSubmit={handleBatchRepSubmit}
          isPending={isPending}
          previewBanner={previewBanner || editingBatchRep.bannerUrl}
          currentAvatarSrc={currentAvatarSrc}
          displayName={editingBatchRep.displayName || editingBatchRep.name}
          role={editingBatchRep.role}
          courseYear={editingBatchRep.courseYear}
          bio={editingBatchRep.bio}
          hideBio={editingBatchRep.hideBio}
          facebookUrl={editingBatchRep.facebookUrl}
          email={editingBatchRep.email}
          linkedinUrl={editingBatchRep.linkedinUrl}
          githubUrl={editingBatchRep.githubUrl}
        >
          <input type="hidden" name="id" value={editingBatchRep.id} />
          <input type="hidden" name="imageUrl" value={editingBatchRep.imageUrl || ""} />
          <input type="hidden" name="bannerUrl" value={editingBatchRep.bannerUrl || ""} />

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F26223]">
              1. Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AdminFieldLabel>Officer Name (Last, First)*</AdminFieldLabel>
                <input
                  name="name"
                  required
                  value={editingBatchRep.name || ""}
                  onChange={(e) =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="e.g. Tantia, Antonio Mickel"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Display Name</AdminFieldLabel>
                <input
                  name="displayName"
                  value={editingBatchRep.displayName || ""}
                  onChange={(e) =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, displayName: e.target.value } : null))
                  }
                  placeholder="e.g. Antonio Mickel Tantia"
                  className={adminInputClass}
                />
              </div>
              <div>
                <AdminFieldLabel>Year Level*</AdminFieldLabel>
                <select
                  name="batchId"
                  value={editingBatchRep.batchId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const opt = BATCH_REP_OPTIONS.find((b) => b.id === val);
                    setEditingBatchRep((prev) =>
                      prev
                        ? {
                            ...prev,
                            batchId: val,
                            batchYear: opt?.label || "1st Year",
                          }
                        : null
                    );
                  }}
                  className={adminInputClass}
                >
                  {BATCH_REP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <AdminFieldLabel>Officer Role / Position*</AdminFieldLabel>
                <input
                  name="role"
                  required
                  list="batch-role-options"
                  value={editingBatchRep.role || ""}
                  onChange={(e) =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, role: e.target.value } : null))
                  }
                  placeholder="e.g. PRESIDENT"
                  className={adminInputClass}
                />
                <datalist id="batch-role-options">
                  {BATCH_ROLE_PRESETS.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <AdminFieldLabel>Course & Year / Section</AdminFieldLabel>
                <input
                  name="courseYear"
                  value={editingBatchRep.courseYear || ""}
                  onChange={(e) =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, courseYear: e.target.value } : null))
                  }
                  placeholder="e.g. BSCPE 1-1"
                  className={adminInputClass}
                />
              </div>
            </div>

            {/* Quick Role Selection Chips */}
            <div className="flex flex-wrap items-center gap-1 text-xs text-zinc-400 mt-2">
              <span className="text-[11px] text-zinc-500 font-medium">Quick Roles:</span>
              {BATCH_ROLE_PRESETS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, role } : null))
                  }
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:bg-[#F26223]/20 hover:border-[#F26223]/40 transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <MediaUploadFields
            onImageChange={handleImageFileChange}
            onBannerChange={handleBannerFileChange}
          />

          <SocialLinksFields
            email={editingBatchRep.email}
            facebookUrl={editingBatchRep.facebookUrl}
            linkedinUrl={editingBatchRep.linkedinUrl}
            githubUrl={editingBatchRep.githubUrl}
            onChange={(field, val) =>
              setEditingBatchRep((prev) => (prev ? { ...prev, [field]: val } : null))
            }
          />

          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <AdminFieldLabel>4. Bio / Description</AdminFieldLabel>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hideBio"
                  checked={Boolean(editingBatchRep.hideBio)}
                  onChange={(e) =>
                    setEditingBatchRep((prev) => (prev ? { ...prev, hideBio: e.target.checked } : null))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#F26223] focus:ring-[#F26223] accent-[#F26223]"
                />
                <span className="text-xs font-semibold text-zinc-300">Hide Bio / Description</span>
              </label>
            </div>
            <textarea
              name="bio"
              rows={3}
              value={editingBatchRep.bio ?? ""}
              onChange={(e) =>
                setEditingBatchRep((prev) => (prev ? { ...prev, bio: e.target.value } : null))
              }
              placeholder="Enter description (leave empty to hide automatically)..."
              className={`${adminTextareaClass} ${editingBatchRep.hideBio ? "opacity-40" : ""}`}
              disabled={editingBatchRep.hideBio}
            />
            <p className="text-[11px] text-zinc-500">
              {editingBatchRep.hideBio
                ? "Bio is explicitly hidden on all cards and popup modals."
                : "If left empty, the bio section will automatically hide."}
            </p>
          </div>
        </EditModalShell>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-neutral-950 p-6 text-white shadow-2xl space-y-6 animate-in scale-in duration-200">
            <div className="pb-4 border-b border-white/10">
              <h3 className="text-xl font-extrabold text-white">Confirm Deletion</h3>
              <p className="text-xs text-zinc-400 mt-1">This action is irreversible.</p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to delete <span className="font-extrabold text-[#F26223]">"{deletingItem.name}"</span>? All profile details, files, and card metadata associated with this representative will be permanently removed.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs transition duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F26223] hover:bg-[#d9531e] text-white font-extrabold text-xs transition duration-150 shadow-[0_4px_16px_rgba(242,98,35,0.25)] border border-[#F26223]/30"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── REUSABLE HELPER COMPONENTS ───────────────────────────────────────────

function OfficerCardAdmin({
  item,
  onEdit,
  onDelete,
}: {
  item: {
    id: string;
    name: string;
    role: string;
    courseYear?: string;
    badgeLabel: string;
    badgeColor: string;
    bio?: string;
    hideBio?: boolean;
    imageUrl?: string;
    facebookUrl?: string;
    email?: string;
    linkedinUrl?: string;
    githubUrl?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasFb = Boolean(item.facebookUrl?.trim());
  const hasEmail = Boolean(item.email?.trim());
  const hasLi = Boolean(item.linkedinUrl?.trim());
  const hasGh = Boolean(item.githubUrl?.trim());

  return (
    <div className="admin-card relative flex flex-col justify-between p-5 rounded-2xl border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:border-[#F26223]/50 hover:shadow-[0_12px_35px_rgba(242,98,35,0.15)] group">
      <div>
        <div className="flex items-start gap-3.5">
          <div
            className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900 flex items-center justify-center shadow-md"
            style={{ border: "2.5px solid #dfc3b4" }}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="56px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] to-[#862520] text-white font-extrabold text-sm">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 truncate max-w-full ${item.badgeColor}`}
            >
              {item.badgeLabel}
            </span>
            <h4
              className="font-extrabold text-white text-sm leading-snug truncate"
              title={item.name}
            >
              {item.name}
            </h4>
            <p
              className="text-xs font-bold text-[#F26223] uppercase tracking-wide mt-0.5 truncate"
              title={item.role}
            >
              {item.role}
            </p>
            {item.courseYear && (
              <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                {item.courseYear}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3.5 pt-2.5 border-t border-white/10 text-[11px] text-zinc-400">
          <span className="text-[10px] font-semibold text-zinc-500 mr-1 uppercase tracking-wider">
            Links:
          </span>
          {hasFb && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
              FB
            </span>
          )}
          {hasEmail && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              Email
            </span>
          )}
          {hasLi && (
            <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
              LinkedIn
            </span>
          )}
          {hasGh && (
            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
              GitHub
            </span>
          )}
          {!hasFb && !hasEmail && !hasLi && !hasGh && (
            <span className="text-[10px] text-zinc-500 italic">None (hidden)</span>
          )}
        </div>

        {item.bio?.trim() && !item.hideBio && (
          <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
            {item.bio}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3.5 border-t border-white/10 mt-3.5">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 text-white hover:bg-[#F26223] text-xs font-bold border border-white/15 hover:border-[#F26223] shadow-sm transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Edit Card</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center p-2 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold border border-rose-500/30 transition-all duration-150"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MediaUploadFields({
  onImageChange,
  onBannerChange,
}: {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="pt-4 border-t border-white/10 space-y-4">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F26223]">
        2. Media & Headshot
      </h4>
      <div className="space-y-3">
        <div>
          <AdminFieldLabel>Upload Headshot Photo</AdminFieldLabel>
          <input
            type="file"
            name="imageFile"
            accept="image/png,image/jpeg,image/webp"
            onChange={onImageChange}
            className={adminFileClass}
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Accepts PNG, JPG, or WebP. Replaces current photo.
          </p>
        </div>
        <div>
          <AdminFieldLabel>Upload Custom Banner (Optional)</AdminFieldLabel>
          <input
            type="file"
            name="bannerFile"
            accept="image/png,image/jpeg,image/webp"
            onChange={onBannerChange}
            className={adminFileClass}
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Optional banner for popup modal. Defaults to fiery molten swirl.
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialLinksFields({
  email,
  facebookUrl,
  linkedinUrl,
  githubUrl,
  onChange,
}: {
  email?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div className="pt-4 border-t border-white/10 space-y-4">
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F26223]">
          3. Contact & Social Links
        </h4>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          Only provided links will be displayed on the modal. Leave any link empty to hide its icon.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <AdminFieldLabel>Email Address</AdminFieldLabel>
          <input
            name="email"
            type="email"
            value={email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="e.g. name@access.org (or blank)"
            className={adminInputClass}
          />
        </div>
        <div>
          <AdminFieldLabel>Facebook Profile URL</AdminFieldLabel>
          <input
            name="facebookUrl"
            value={facebookUrl || ""}
            onChange={(e) => onChange("facebookUrl", e.target.value)}
            placeholder="https://facebook.com/... (or blank)"
            className={adminInputClass}
          />
        </div>
        <div>
          <AdminFieldLabel>LinkedIn Profile URL</AdminFieldLabel>
          <input
            name="linkedinUrl"
            value={linkedinUrl || ""}
            onChange={(e) => onChange("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/... (or blank)"
            className={adminInputClass}
          />
        </div>
        <div>
          <AdminFieldLabel>GitHub Profile URL</AdminFieldLabel>
          <input
            name="githubUrl"
            value={githubUrl || ""}
            onChange={(e) => onChange("githubUrl", e.target.value)}
            placeholder="https://github.com/... (or blank)"
            className={adminInputClass}
          />
        </div>
      </div>
    </div>
  );
}

function EditModalShell({
  title,
  onClose,
  onSubmit,
  isPending,
  previewBanner,
  currentAvatarSrc,
  displayName,
  role,
  courseYear,
  bio,
  hideBio,
  facebookUrl,
  email,
  linkedinUrl,
  githubUrl,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  previewBanner?: string | null;
  currentAvatarSrc?: string | null;
  displayName?: string;
  role?: string;
  courseYear?: string;
  bio?: string;
  hideBio?: boolean;
  facebookUrl?: string;
  email?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-3xl border border-white/20 bg-neutral-950 p-5 sm:p-7 text-white shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Customize card details, headshot, banner, contact links, and description.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-base"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">{children}</div>

          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl border border-white/10 bg-[#120603] space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <span>👁️ Live Popup Preview</span>
              </p>

              <div className="relative w-full rounded-2xl border border-white/40 bg-[#160603] text-white shadow-xl overflow-hidden">
                <div
                  className="relative w-full h-24 overflow-hidden"
                  style={{ background: LAVA_BANNER_BG }}
                >
                  {previewBanner ? (
                    <Image
                      src={previewBanner}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>

                <div className="relative flex items-end px-4">
                  <div className="relative -mt-10 flex-shrink-0 z-10">
                    <div
                      className="relative h-18 w-18 rounded-full overflow-hidden flex-center bg-[#180603]"
                      style={{
                        border: "3px solid #dfc3b4",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.8)",
                      }}
                    >
                      {currentAvatarSrc ? (
                        <Image
                          src={currentAvatarSrc}
                          alt="Avatar Preview"
                          fill
                          sizes="72px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f26223] to-[#862520] text-white font-extrabold text-base">
                          {displayName ? displayName.slice(0, 2).toUpperCase() : "AC"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center pl-3 pb-1 min-w-0 flex-1">
                    <h5 className="font-bold text-white text-sm leading-tight truncate">
                      {displayName || "Officer Name"}
                    </h5>
                    <p className="font-extrabold text-[#e85e1e] text-[11px] uppercase tracking-wider mt-0.5 truncate">
                      {role || "POSITION TITLE"}
                    </p>
                    {courseYear && (
                      <p className="font-semibold text-zinc-300 text-[10px] truncate">
                        {courseYear}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/20 mx-4 mt-3.5 mb-2.5" />

                <div className="flex items-center gap-3 px-4 text-zinc-300">
                  {facebookUrl?.trim() && (
                    <span className="text-[10px] font-bold text-blue-400">FB</span>
                  )}
                  {email?.trim() && (
                    <span className="text-[10px] font-bold text-emerald-400">Email</span>
                  )}
                  {linkedinUrl?.trim() && (
                    <span className="text-[10px] font-bold text-sky-400">LinkedIn</span>
                  )}
                  {githubUrl?.trim() && (
                    <span className="text-[10px] font-bold text-purple-400">GitHub</span>
                  )}
                  {!facebookUrl?.trim() &&
                    !email?.trim() &&
                    !linkedinUrl?.trim() &&
                    !githubUrl?.trim() && (
                      <span className="text-[10px] text-zinc-500 italic">No links configured</span>
                    )}
                </div>

                {bio?.trim() && !hideBio ? (
                  <p className="text-zinc-300 text-[11px] leading-relaxed px-4 pt-2 pb-4 line-clamp-3">
                    {bio}
                  </p>
                ) : (
                  <div className="px-4 pt-2 pb-3.5">
                    <p className="text-zinc-500 text-[10px] italic">
                      Bio hidden {!bio?.trim() ? "(no text entered)" : "(hidden toggle active)"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#F26223] to-[#d9531e] text-white font-extrabold text-sm shadow-[0_4px_16px_rgba(242,98,35,0.4)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? "Saving Changes..." : "Save Details"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={adminBtnSecondaryClass}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
