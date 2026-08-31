"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  clearAllNotificationsAction,
} from "@/features/notifications/actions/notifications.actions";
import type { NotificationRow } from "@/features/notifications";

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

interface NotificationBellProps {
  initialNotifications: NotificationRow[];
}

export default function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
          setAnimateBell(true);
          setTimeout(() => setAnimateBell(false), 1500);
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
    };
  }, []);

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
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      await markNotificationAsReadAction(notif.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsReadAction();
  };

  const handleClearAll = async () => {
    // Optimistic update
    setNotifications([]);
    setIsOpen(false);
    await clearAllNotificationsAction();
  };

  return (
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
                  className={`flex flex-col gap-1 p-3 text-left hover:bg-white/5 transition min-w-0 ${
                    !notif.is_read ? "bg-white/[0.02]" : ""
                  }`}
                >
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
  );
}
