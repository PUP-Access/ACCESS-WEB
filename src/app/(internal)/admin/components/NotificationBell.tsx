"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearAllNotificationsAction,
} from "@/features/notifications/actions/notifications.actions";
import type { NotificationRow } from "@/features/notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
}

// Global AudioContext singleton to handle browser autoplay policies
let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx || globalAudioCtx.state === "closed") {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/** Plays a short, crisp, pleasant notification chime using Web Audio API. */
function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: High pitch chime (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Bright harmonic chime (E6 - 1318.51Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.1);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.error("Audio notification play error:", err);
  }
}

// ---------------------------------------------------------------------------
// Notification type icon helper
// ---------------------------------------------------------------------------

function getTypeIcon(type: string) {
  switch (type) {
    case "borrow_request":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-blue-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      );
    case "contact_message":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-emerald-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      );
    case "user_registration":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-[#FFB89A]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Toast Component
// ---------------------------------------------------------------------------

interface ToastItem {
  id: string;
  notification: NotificationRow;
  exiting: boolean;
}

function NotificationToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`pointer-events-auto flex w-84 max-w-[90vw] items-start gap-3 rounded-xl border border-white/15 bg-[#1C1010] p-3.5 shadow-2xl transition-all duration-300 ${
        toast.exiting
          ? "translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
      }`}
    >
      <Link
        href={toast.notification.link || "#"}
        onClick={() => onDismiss(toast.id)}
        className="flex flex-1 items-start gap-3 min-w-0 hover:opacity-90 transition group"
      >
        <div className="mt-0.5 shrink-0">
          {getTypeIcon(toast.notification.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white group-hover:text-[#FFB89A] transition truncate">
            {toast.notification.title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/70 line-clamp-2 leading-relaxed">
            {toast.notification.content}
          </p>
          <p className="mt-1 text-[10px] font-medium text-white/40">Just now</p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
        aria-label="Dismiss notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface NotificationBellProps {
  initialNotifications: NotificationRow[];
}

export default function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Track client mount state for React Portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Unlock Web Audio context on user interaction to abide by browser Autoplay policy
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext();
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("click", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  // Dismiss a toast (with exit animation)
  const dismissToast = useCallback((toastId: string) => {
    const timer = toastTimersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(toastId);
    }

    setToasts((prev) =>
      prev.map((t) => (t.id === toastId ? { ...t, exiting: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 300);
  }, []);

  // Add a new toast
  const addToast = useCallback(
    (notification: NotificationRow) => {
      const toastId = `toast-${notification.id}-${Date.now()}`;
      const newToast: ToastItem = { id: toastId, notification, exiting: false };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      const timer = setTimeout(() => dismissToast(toastId), 5000);
      toastTimersRef.current.set(toastId, timer);
    },
    [dismissToast]
  );

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notifications" },
        (payload) => {
          const newNotif = payload.new as NotificationRow;
          setNotifications((prev) => [newNotif, ...prev]);

          // Sound + bell animation
          playNotificationSound();
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 1500);

          // Float toast
          addToast(newNotif);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Notifications" },
        (payload) => {
          const updatedNotif = payload.new as NotificationRow;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "Notifications" },
        (payload) => {
          const oldNotif = payload.old as { id: string };
          setNotifications((prev) => prev.filter((n) => n.id !== oldNotif.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, [addToast]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      await markNotificationAsReadAction(notif.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsReadAction();
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setIsOpen(false);
    await clearAllNotificationsAction();
  };

  return (
    <>
      {/* Floating Toast Container rendered via React Portal directly into document.body */}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
            {toasts.map((toast) => (
              <NotificationToast
                key={toast.id}
                toast={toast}
                onDismiss={dismissToast}
              />
            ))}
          </div>,
          document.body
        )}

      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white transition focus:outline-none"
          aria-label="View notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`h-5 w-5 ${animateBell ? "animate-bounce text-[#FFB800]" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>

          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-[#120808]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Card */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#1C1010] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-white/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-semibold text-[#FFB89A] hover:text-[#FFD4BC] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-white/35">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.link || "#"}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-2.5 p-3 text-left hover:bg-white/5 transition min-w-0 ${
                      !notif.is_read ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getTypeIcon(notif.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <p className={`text-xs truncate min-w-0 ${!notif.is_read ? "font-bold text-white" : "text-white/80"}`}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-white/35">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/55 line-clamp-2 break-words leading-relaxed">
                        {notif.content}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-white/5 px-4 py-2.5 bg-white/[0.02]">
                <button
                  onClick={handleClearAll}
                  className="w-full rounded-lg py-1.5 text-[11px] font-semibold text-white/40 hover:bg-white/5 hover:text-red-400 transition"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

