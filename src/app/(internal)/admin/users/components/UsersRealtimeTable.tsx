"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { UserRow, UserRole } from "@/features/users/types";
import UserRoleSelect from "./UserRoleSelect";
import QuickApproveButton from "./QuickApproveButton";
import DeleteUserButton from "./DeleteUserButton";
import { formatFullDateTime } from "@/lib/date-utils";

type UsersRealtimeTableProps = {
  initialUsers: UserRow[];
  currentRoleFilter?: string;
};

function getEligibilityBadge(role: UserRole | null) {
  switch (role) {
    case "Organization":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Eligible (Org)
        </span>
      );
    case "Admin":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-300">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          Admin Access
        </span>
      );
    case "Tech":
    case "SponsorsPartners":
    case "Govs":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Staff Access ({role === "SponsorsPartners" ? "Sponsors & Partners" : role})
        </span>
      );
    case "Pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Ineligible (Pending)
        </span>
      );
  }
}

export default function UsersRealtimeTable({
  initialUsers,
  currentRoleFilter = "All",
}: UsersRealtimeTableProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [isLive, setIsLive] = useState(false);
  const [recentUpdatedId, setRecentUpdatedId] = useState<string | null>(null);

  // Sync state if server props change (e.g. pagination or filter navigation)
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Set up Supabase Realtime Event Listener
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("realtime:admin_users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Users" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newUser = payload.new as UserRow;
            // Only add if it matches current filter
            if (
              currentRoleFilter === "All" ||
              currentRoleFilter === newUser.role
            ) {
              setUsers((prev) => [
                newUser,
                ...prev.filter((u) => u.id !== newUser.id),
              ]);
              setRecentUpdatedId(newUser.id);
              setTimeout(() => setRecentUpdatedId(null), 2500);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedUser = payload.new as UserRow;
            setUsers((prev) =>
              prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            );
            setRecentUpdatedId(updatedUser.id);
            setTimeout(() => setRecentUpdatedId(null), 2500);
          } else if (payload.eventType === "DELETE") {
            const oldUser = payload.old as { id: string };
            setUsers((prev) => prev.filter((u) => u.id !== oldUser.id));
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoleFilter]);

  const handleLocalRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setRecentUpdatedId(userId);
    setTimeout(() => setRecentUpdatedId(null), 2000);
  };

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-3">
      {/* Live sync indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isLive ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"
            }`}
          />
          <span className="text-xs font-medium text-white/50">
            {isLive ? "Real-time Event Listener Active" : "Connecting Live Sync..."}
          </span>
        </div>
        <span className="text-xs text-white/40">
          Showing {users.length} {users.length === 1 ? "account" : "accounts"}
        </span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Organization / Name</th>
              <th>Email</th>
              <th>Borrowing Eligibility</th>
              <th>Assigned Role</th>
              <th>Registered</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isHighlighted = recentUpdatedId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`transition-colors duration-500 ${
                    isHighlighted ? "bg-orange-500/15" : ""
                  }`}
                >
                  <td>
                    <div className="font-semibold text-white">
                      {user.organization_name || "—"}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-white/70">
                      {user.email}
                    </span>
                  </td>
                  <td>{getEligibilityBadge(user.role)}</td>
                  <td>
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={user.role}
                      onRoleChange={(newRole) =>
                        handleLocalRoleChange(user.id, newRole)
                      }
                    />
                  </td>
                  <td className="text-xs text-white/45">
                    {formatFullDateTime(user.created_at)}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {user.role === "Pending" && (
                        <QuickApproveButton
                          userId={user.id}
                          onSuccess={() =>
                            handleLocalRoleChange(user.id, "Organization")
                          }
                        />
                      )}
                      <DeleteUserButton
                        user={user}
                        onDeleted={handleUserDeleted}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-white/40">
                  No accounts found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
