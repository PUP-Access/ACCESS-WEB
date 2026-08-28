"use client";

import { useState, useMemo, useTransition } from "react";
import type { ContactMessage } from "@/features/cms/services/contact-messages.service";
import {
  markContactMessageReadAction,
  markContactMessageUnreadAction,
  archiveContactMessageAction,
  deleteContactMessageAction,
} from "@/features/cms/actions/cms.actions";
import AdminMessageReply from "./AdminMessageReply";

import { formatRelativeDateTime } from "@/lib/date-utils";

type TabMode = "inbox" | "archived";
type FilterStatus = "all" | "unread" | "read";
type SortOrder = "newest" | "oldest";

function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/[\s,]+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null): { relative: string; full: string } {
  return formatRelativeDateTime(dateStr);
}

export default function ContactMessagesList({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [tabMode, setTabMode] = useState<TabMode>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const triggerToast = (type: "success" | "error" | "info", title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Counts
  const activeMessages = useMemo(() => messages.filter((m) => !m.is_archived), [messages]);
  const archivedMessages = useMemo(() => messages.filter((m) => !!m.is_archived), [messages]);

  const totalActive = activeMessages.length;
  const unreadActive = activeMessages.filter((m) => !m.is_read).length;
  const readActive = totalActive - unreadActive;
  const totalArchived = archivedMessages.length;

  // Filter & search based on tabMode
  const filteredMessages = useMemo(() => {
    const baseList = tabMode === "inbox" ? activeMessages : archivedMessages;

    return baseList
      .filter((m) => {
        // Status filter (inbox only)
        if (tabMode === "inbox") {
          if (statusFilter === "unread" && m.is_read) return false;
          if (statusFilter === "read" && !m.is_read) return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.course_year_section?.toLowerCase().includes(q) ||
          m.contact_number?.toLowerCase().includes(q) ||
          m.organization?.toLowerCase().includes(q) ||
          m.purpose?.toLowerCase().includes(q) ||
          m.concern?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [activeMessages, archivedMessages, tabMode, statusFilter, searchQuery, sortOrder]);

  const handleToggleRead = (id: string, currentIsRead: boolean) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: !currentIsRead } : m))
    );

    triggerToast(
      "info",
      !currentIsRead ? "Marked as Read" : "Marked as Unread",
      !currentIsRead ? "Message status updated to read." : "Message status updated to unread."
    );

    startTransition(async () => {
      try {
        if (currentIsRead) {
          await markContactMessageUnreadAction(id);
        } else {
          await markContactMessageReadAction(id);
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_read: currentIsRead } : m))
        );
        triggerToast("error", "Error", "Failed to update message status.");
      }
    });
  };

  const handleToggleArchive = (id: string, currentIsArchived: boolean) => {
    const targetMsg = messages.find((m) => m.id === id);
    const newArchivedState = !currentIsArchived;

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_archived: newArchivedState } : m))
    );

    if (activeReplyId === id) {
      setActiveReplyId(null);
    }

    triggerToast(
      "success",
      newArchivedState ? "Archived" : "Restored to Inbox",
      newArchivedState
        ? `Message from ${targetMsg?.full_name || "User"} moved to archive.`
        : `Message from ${targetMsg?.full_name || "User"} restored to inbox.`
    );

    startTransition(async () => {
      try {
        await archiveContactMessageAction(id, newArchivedState);
      } catch (err) {
        // Revert on error
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_archived: currentIsArchived } : m))
        );
        triggerToast("error", "Error", "Failed to update archive status.");
      }
    });
  };

  const handleDeleteMessage = (id: string) => {
    const targetMsg = messages.find((m) => m.id === id);
    setDeleteTarget(null);

    // Optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (activeReplyId === id) {
      setActiveReplyId(null);
    }

    triggerToast(
      "success",
      "Message Deleted",
      `Inquiry from ${targetMsg?.full_name || "User"} was permanently deleted.`
    );

    startTransition(async () => {
      try {
        await deleteContactMessageAction(id);
      } catch (err) {
        if (targetMsg) {
          setMessages((prev) => [targetMsg, ...prev]);
        }
        triggerToast("error", "Error", "Failed to delete message from database.");
      }
    });
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsReadFromReply = (id: string, details?: { email: string; subject: string }) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );
    if (details) {
      triggerToast(
        "success",
        "Reply Dispatched Successfully!",
        `Email successfully delivered via Resend to ${details.email}`
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ── METRIC STATS OVERVIEW (Matching Dashboard Theme) ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Inbox */}
        <div
          onClick={() => {
            setTabMode("inbox");
            setStatusFilter("all");
          }}
          className={`admin-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${
            tabMode === "inbox" && statusFilter === "all" ? "ring-2 ring-[#F26223]" : ""
          }`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
            style={{ background: "#F26223" }}
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">Active Inbox</p>
          <p className="title-header mt-3 text-4xl font-extrabold">{totalActive}</p>
          <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
            View Inbox →
          </p>
        </div>

        {/* Unread Inquiries */}
        <div
          onClick={() => {
            setTabMode("inbox");
            setStatusFilter("unread");
          }}
          className={`admin-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${
            tabMode === "inbox" && statusFilter === "unread" ? "ring-2 ring-amber-500" : ""
          }`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
            style={{ background: "#FFB800" }}
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/80">Unread Messages</p>
          <p className="title-header mt-3 text-4xl font-extrabold text-amber-300">{unreadActive}</p>
          <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
            Filter Unread →
          </p>
        </div>

        {/* Read / Handled */}
        <div
          onClick={() => {
            setTabMode("inbox");
            setStatusFilter("read");
          }}
          className={`admin-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${
            tabMode === "inbox" && statusFilter === "read" ? "ring-2 ring-emerald-500" : ""
          }`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
            style={{ background: "#10B981" }}
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300/80">Read / Handled</p>
          <p className="title-header mt-3 text-4xl font-extrabold text-emerald-300">{readActive}</p>
          <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
            Filter Read →
          </p>
        </div>

        {/* Archived Messages */}
        <div
          onClick={() => setTabMode("archived")}
          className={`admin-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${
            tabMode === "archived" ? "ring-2 ring-[#FF8C00]" : ""
          }`}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
            style={{ background: "#FF8C00" }}
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">Archived</p>
          <p className="title-header mt-3 text-4xl font-extrabold">{totalArchived}</p>
          <p className="mt-4 text-xs font-semibold text-[#FFB89A]/80 transition group-hover:text-[#FFD4BC]">
            View Archive →
          </p>
        </div>
      </div>

      {/* ── TOOLBAR: TABS, SEARCH & FILTERS ── */}
      <div className="space-y-3 pt-2">
        {/* Main Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTabMode("inbox")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                tabMode === "inbox"
                  ? "bg-[#F26223] text-white shadow-md shadow-[#F26223]/25"
                  : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span>Active Inbox ({totalActive})</span>
            </button>

            <button
              onClick={() => setTabMode("archived")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                tabMode === "archived"
                  ? "bg-[#FF8C00] text-white shadow-md shadow-[#FF8C00]/25"
                  : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Archived ({totalArchived})</span>
            </button>
          </div>

          <div className="text-xs text-white/40">
            Showing {filteredMessages.length} {tabMode === "inbox" ? "inbox" : "archived"} inquiry{filteredMessages.length === 1 ? "" : "ies"}
          </div>
        </div>

        {/* Search Bar & Sub-Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/40">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by name, email, concern, section, purpose...`}
              className="w-full rounded-xl bg-white/[0.04] py-2.5 pr-10 pl-10 text-sm text-white placeholder-white/40 ring-1 ring-white/10 transition-all focus:bg-white/[0.07] focus:ring-2 focus:ring-[#FF6B35]/60 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills & Sort Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {tabMode === "inbox" && (
              <div className="flex rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/10">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-[#F26223] text-white shadow-md shadow-[#F26223]/20"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  All ({totalActive})
                </button>
                <button
                  onClick={() => setStatusFilter("unread")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === "unread"
                      ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Unread ({unreadActive})
                </button>
                <button
                  onClick={() => setStatusFilter("read")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    statusFilter === "read"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Read ({readActive})
                </button>
              </div>
            )}

            {/* Sort Selector */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 ring-1 ring-white/10 transition-all hover:bg-white/[0.07] focus:ring-2 focus:ring-[#FF6B35]/60 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#1a1a1a] text-white">
                Newest first
              </option>
              <option value="oldest" className="bg-[#1a1a1a] text-white">
                Oldest first
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MESSAGES LIST ── */}
      {filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40">
            {tabMode === "archived" ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-white/80">
            {tabMode === "archived" ? "No archived messages" : "No messages found"}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {searchQuery
              ? `No messages matched "${searchQuery}".`
              : tabMode === "archived"
              ? "Messages you archive will be saved here."
              : statusFilter === "unread"
              ? "All caught up! No unread messages."
              : "No contact messages in inbox."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs font-semibold text-[#FF6B35] hover:underline"
            >
              Clear search query
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => {
            const { relative, full } = formatDate(message.created_at);
            const isUnread = !message.is_read;
            const initials = getInitials(message.full_name || "");

            return (
              <div
                key={message.id}
                className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-200 border ${
                  isUnread && tabMode === "inbox"
                    ? "bg-gradient-to-br from-[#1c120c]/95 via-[#160d09]/85 to-[#120a06]/95 border-amber-500/35 shadow-lg shadow-amber-500/5 hover:border-amber-500/50"
                    : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                }`}
              >
                {/* Visual left accent bar for unread in inbox */}
                {isUnread && tabMode === "inbox" && (
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-[#FF6B35] to-amber-500" />
                )}

                {/* ── CARD TOP SECTION: SENDER DETAILS & ACTION TOOLBAR ── */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-white/[0.06] pb-4">
                  {/* Left: Sender Profile */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* User Avatar Initials */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-md ${
                        isUnread && tabMode === "inbox"
                          ? "bg-gradient-to-br from-[#FF6B35] to-amber-600 text-white ring-2 ring-amber-400/30"
                          : "bg-white/10 text-white/80 ring-1 ring-white/10"
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Sender Info & Status */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white sm:text-lg tracking-tight truncate">
                          {message.full_name}
                        </h3>

                        {message.is_archived ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 ring-1 ring-blue-500/30">
                            Archived
                          </span>
                        ) : isUnread ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Unread
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 ring-1 ring-white/10">
                            Read
                          </span>
                        )}
                      </div>

                      {/* Email + Copy + Date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`mailto:${message.email}`}
                            className="hover:text-[#FF8C55] transition-colors truncate hover:underline"
                            title="Open in mail client"
                          >
                            {message.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(message.email, message.id)}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-white/40 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            title="Copy email address"
                          >
                            {copiedId === message.id ? (
                              <span className="text-emerald-400 font-medium">Copied!</span>
                            ) : (
                              <>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <span className="text-white/20 hidden sm:inline">•</span>

                        <div className="text-[11px] text-white/40" title={full}>
                          {relative} ({full})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 xl:pt-0">
                    {/* Reply via Email */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReplyId(activeReplyId === message.id ? null : message.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E04810] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#FF6B35]/20 hover:from-[#FF7D4D] hover:to-[#EB551D] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                        />
                      </svg>
                      <span>{activeReplyId === message.id ? "Close Reply" : "Reply via Email"}</span>
                    </button>

                    {/* Mark as Read / Unread */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleRead(message.id, Boolean(message.is_read))}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12] hover:text-white hover:ring-white/20 transition-all cursor-pointer"
                      title={message.is_read ? "Mark as unread" : "Mark as read"}
                    >
                      {message.is_read ? (
                        <>
                          <svg className="h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Mark Unread</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Mark Read</span>
                        </>
                      )}
                    </button>

                    {/* Archive / Unarchive */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleArchive(message.id, Boolean(message.is_archived))}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:bg-blue-500/20 hover:text-blue-200 hover:ring-blue-500/30 transition-all cursor-pointer"
                      title={message.is_archived ? "Restore to inbox" : "Move to archive"}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{message.is_archived ? "Unarchive" : "Archive"}</span>
                    </button>

                    {/* Delete Permanently */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget(message)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/25 hover:bg-red-500/20 hover:text-red-200 hover:ring-red-500/40 transition-all cursor-pointer"
                      title="Permanently delete message"
                    >
                      <svg className="h-3.5 w-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* ── METADATA PILLS GRID ── */}
                <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Course / Section */}
                  <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Course / Section
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white/90 truncate">
                      {message.course_year_section || "—"}
                    </span>
                  </div>

                  {/* Contact Number */}
                  <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Contact No.
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white/90 truncate">
                      {message.contact_number ? (
                        <a
                          href={`tel:${message.contact_number}`}
                          className="hover:text-[#FF8C55] hover:underline"
                        >
                          {message.contact_number}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  {/* Organization */}
                  <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Organization
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white/90 truncate">
                      {message.organization || "—"}
                    </span>
                  </div>

                  {/* Purpose */}
                  <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Purpose
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white/90 truncate">
                      {message.purpose || "—"}
                    </span>
                  </div>
                </div>

                {/* ── CONCERN MESSAGE CALLOUT BOX ── */}
                <div className="rounded-xl border-l-4 border-[#FF6B35] bg-black/40 p-4 ring-1 ring-white/5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    <svg className="h-3.5 w-3.5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Concern & Details
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">
                    {message.concern}
                  </p>
                </div>

                {/* ── EMBEDDED REPLY COMPOSER (WHEN OPEN) ── */}
                {activeReplyId === message.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <AdminMessageReply
                      messageId={message.id}
                      userName={message.full_name || ""}
                      userEmail={message.email}
                      originalSubject={message.purpose || message.concern?.slice(0, 30) || ""}
                      onClose={() => setActiveReplyId(null)}
                      onSuccess={(details) => {
                        setActiveReplyId(null);
                        handleMarkAsReadFromReply(message.id, details);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PERMANENT DELETE CONFIRMATION MODAL ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1c1010] p-6 ring-1 ring-red-500/30 shadow-2xl border border-red-500/20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 ring-1 ring-red-500/30">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  Delete Contact Message?
                </h3>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  Are you sure you want to permanently delete the inquiry from{" "}
                  <strong className="text-white">{deleteTarget.full_name}</strong> ({deleteTarget.email})?
                </p>
                <p className="mt-1 text-xs text-red-400/90 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Snippet preview */}
            <div className="mt-4 rounded-xl bg-black/40 p-3 ring-1 ring-white/10 text-xs text-white/70 italic line-clamp-3">
              &ldquo;{deleteTarget.concern}&rdquo;
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(deleteTarget.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING VERIFICATION TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-start gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-xl ring-1 ${
              toast.type === "success"
                ? "bg-[#102416]/95 ring-emerald-500/40 text-emerald-200 border border-emerald-500/20"
                : toast.type === "error"
                ? "bg-[#241010]/95 ring-red-500/40 text-red-200 border border-red-500/20"
                : "bg-[#18181b]/95 ring-white/20 text-white/90 border border-white/10"
            }`}
          >
            {toast.type === "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : toast.type === "error" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                {toast.title}
              </h5>
              <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
