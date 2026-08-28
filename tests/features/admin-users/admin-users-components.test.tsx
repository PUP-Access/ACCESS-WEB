import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersRealtimeTable from "@/app/(internal)/admin/users/components/UsersRealtimeTable";
import UserRoleSelect from "@/app/(internal)/admin/users/components/UserRoleSelect";
import QuickApproveButton from "@/app/(internal)/admin/users/components/QuickApproveButton";
import DeleteUserButton from "@/app/(internal)/admin/users/components/DeleteUserButton";
import UserSearchBar from "@/app/(internal)/admin/users/components/UserSearchBar";
import * as usersActions from "@/features/users/actions/users.actions";
import type { UserRow } from "@/features/users/types";
import { useRouter, useSearchParams } from "next/navigation";

// Mock user actions
vi.mock("@/features/users/actions/users.actions", () => ({
  updateUserRoleAction: vi.fn(),
  deleteUserAccountAction: vi.fn(),
}));

// Mock browser client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockImplementation((cb) => {
    cb("SUBSCRIBED");
    return { unsubscribe: vi.fn() };
  }),
};
const mockRemoveChannel = vi.fn();

vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  })),
}));

describe("Admin Users UI Components", () => {
  const sampleUsers: UserRow[] = [
    {
      id: "u-pending",
      email: "pending@pupaccess.org",
      organization_name: "Pending Tech Org",
      role: "Pending",
      created_at: "2026-08-01T12:00:00Z",
      updated_at: "2026-08-01T12:00:00Z",
    },
    {
      id: "u-org",
      email: "org@pupaccess.org",
      organization_name: "Active Society",
      role: "Organization",
      created_at: "2026-07-15T10:00:00Z",
      updated_at: "2026-07-15T10:00:00Z",
    },
    {
      id: "u-admin",
      email: "admin@pupaccess.org",
      organization_name: "Lead Admin",
      role: "Admin",
      created_at: "2026-01-01T08:00:00Z",
      updated_at: "2026-01-01T08:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UsersRealtimeTable", () => {
    it("renders user rows with roles, eligibility badges, and action buttons", () => {
      render(<UsersRealtimeTable initialUsers={sampleUsers} />);

      expect(screen.getByText("Pending Tech Org")).toBeInTheDocument();
      expect(screen.getByText("pending@pupaccess.org")).toBeInTheDocument();
      expect(screen.getByText("Ineligible (Pending)")).toBeInTheDocument();

      expect(screen.getByText("Active Society")).toBeInTheDocument();
      expect(screen.getByText("Eligible (Org)")).toBeInTheDocument();

      expect(screen.getByText("Lead Admin")).toBeInTheDocument();
      expect(screen.getByText("Admin Access")).toBeInTheDocument();

      // Quick approve should only be visible for Pending users
      expect(screen.getAllByRole("button", { name: /Approve Org/i })).toHaveLength(1);
    });

    it("displays empty state when no users are provided", () => {
      render(<UsersRealtimeTable initialUsers={[]} />);

      expect(
        screen.getByText(/No accounts found matching your filter criteria/i)
      ).toBeInTheDocument();
    });

    it("subscribes to realtime channel on mount and removes channel on unmount", () => {
      const { unmount } = render(<UsersRealtimeTable initialUsers={sampleUsers} />);

      expect(mockChannel.subscribe).toHaveBeenCalled();
      unmount();
      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("UserRoleSelect", () => {
    it("renders current role and triggers updateUserRoleAction upon role change", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      vi.mocked(usersActions.updateUserRoleAction).mockResolvedValue({
        status: "success",
        message: "Updated",
      });

      render(
        <UserRoleSelect
          userId="u-pending"
          currentRole="Pending"
          onRoleChange={onRoleChange}
        />
      );

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("Pending");

      await user.selectOptions(select, "Organization");

      expect(onRoleChange).toHaveBeenCalledWith("Organization");
      expect(usersActions.updateUserRoleAction).toHaveBeenCalledWith(
        "u-pending",
        "Organization"
      );
      await waitFor(() => {
        expect(screen.getByText("Updated")).toBeInTheDocument();
      });
    });

    it("reverts role and shows error message when action fails", async () => {
      const user = userEvent.setup();
      const onRoleChange = vi.fn();
      vi.mocked(usersActions.updateUserRoleAction).mockResolvedValue({
        status: "error",
        message: "Failed to update role",
      });

      render(
        <UserRoleSelect
          userId="u-pending"
          currentRole="Pending"
          onRoleChange={onRoleChange}
        />
      );

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "Admin");

      await waitFor(() => {
        expect(screen.getByText("Failed to update role")).toBeInTheDocument();
        expect(select).toHaveValue("Pending");
      });
    });
  });

  describe("QuickApproveButton", () => {
    it("calls updateUserRoleAction with Organization and executes onSuccess callback", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      vi.mocked(usersActions.updateUserRoleAction).mockResolvedValue({
        status: "success",
      });

      render(<QuickApproveButton userId="user-to-approve" onSuccess={onSuccess} />);

      const approveBtn = screen.getByRole("button", { name: /Approve Org/i });
      await user.click(approveBtn);

      expect(usersActions.updateUserRoleAction).toHaveBeenCalledWith(
        "user-to-approve",
        "Organization"
      );
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("DeleteUserButton", () => {
    it("opens confirmation modal, displays user email, and performs permanent deletion", async () => {
      const user = userEvent.setup();
      const onDeleted = vi.fn();
      vi.mocked(usersActions.deleteUserAccountAction).mockResolvedValue({
        status: "success",
      });

      render(<DeleteUserButton user={sampleUsers[0]} onDeleted={onDeleted} />);

      const deleteBtn = screen.getByRole("button", { name: /^Delete$/i });
      await user.click(deleteBtn);

      // Modal should be visible
      expect(screen.getByText(/Delete User Account\?/i)).toBeInTheDocument();
      expect(screen.getByText("pending@pupaccess.org")).toBeInTheDocument();

      const confirmBtn = screen.getByRole("button", { name: /Permanently Delete/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(usersActions.deleteUserAccountAction).toHaveBeenCalledWith("u-pending");
        expect(onDeleted).toHaveBeenCalledWith("u-pending");
        expect(screen.queryByText(/Delete User Account\?/i)).not.toBeInTheDocument();
      });
    });

    it("closes modal without deleting when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onDeleted = vi.fn();

      render(<DeleteUserButton user={sampleUsers[0]} onDeleted={onDeleted} />);

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      expect(screen.getByText(/Delete User Account\?/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(screen.queryByText(/Delete User Account\?/i)).not.toBeInTheDocument();
      expect(usersActions.deleteUserAccountAction).not.toHaveBeenCalled();
    });
  });

  describe("UserSearchBar", () => {
    it("allows typing search query and clears search when clear button is clicked", async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("search=test") as unknown as ReturnType<typeof useSearchParams>);

      render(<UserSearchBar initialSearch="test" />);

      const input = screen.getByPlaceholderText(/Search by email or organization/i);
      expect(input).toHaveValue("test");

      const clearBtn = screen.getByRole("button", { name: /Clear search/i });
      await user.click(clearBtn);

      expect(input).toHaveValue("");
      expect(mockPush).toHaveBeenCalled();
    });
  });
});
