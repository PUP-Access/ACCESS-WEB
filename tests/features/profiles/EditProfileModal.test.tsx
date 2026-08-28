import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfileModal from "@/components/ui/EditProfileModal";
import * as userActions from "@/features/users/actions/users.actions";
import * as authActions from "@/features/auth/actions/auth.actions";

vi.mock("@/features/users/actions/users.actions", () => ({
  updateUserProfileAction: vi.fn(),
  changeUserPasswordAction: vi.fn(),
}));

vi.mock("@/features/auth/actions/auth.actions", () => ({
  signOut: vi.fn(),
}));

describe("EditProfileModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentName: "Association of Computer Engineers",
    userEmail: "org@pupaccess.org",
    currentAvatarUrl: null,
    onSaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(<EditProfileModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders profile tab with current user information", () => {
    render(<EditProfileModal {...defaultProps} />);

    expect(screen.getByText(/Account & Profile Settings/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("org@pupaccess.org")).toBeDisabled();
    expect(
      screen.getByDisplayValue("Association of Computer Engineers")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Profile/i })).toBeInTheDocument();
  });

  it("switches to Password & Security tab and renders password fields", async () => {
    const user = userEvent.setup();
    render(<EditProfileModal {...defaultProps} />);

    const passwordTabBtn = screen.getByRole("button", { name: /Password & Security/i });
    await user.click(passwordTabBtn);

    expect(screen.getByPlaceholderText(/Enter your current password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Minimum 6 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Re-enter new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update Password/i })).toBeInTheDocument();
  });

  it("validates empty organization name before submitting profile", async () => {
    const user = userEvent.setup();
    render(<EditProfileModal {...defaultProps} />);

    const nameInput = screen.getByDisplayValue("Association of Computer Engineers");
    await user.clear(nameInput);
    await user.type(nameInput, "   ");

    const saveBtn = screen.getByRole("button", { name: /Save Profile/i });
    await user.click(saveBtn);

    expect(
      screen.getByText(/Organization \/ Display Name cannot be empty/i)
    ).toBeInTheDocument();
    expect(userActions.updateUserProfileAction).not.toHaveBeenCalled();
  });

  it("submits profile changes and calls onSaved callback upon success", async () => {
    const user = userEvent.setup();
    vi.mocked(userActions.updateUserProfileAction).mockResolvedValue({
      status: "success",
      message: "Profile updated successfully!",
    });

    render(<EditProfileModal {...defaultProps} />);

    const nameInput = screen.getByDisplayValue("Association of Computer Engineers");
    await user.clear(nameInput);
    await user.type(nameInput, "New Org Name");

    const saveBtn = screen.getByRole("button", { name: /Save Profile/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(userActions.updateUserProfileAction).toHaveBeenCalledWith({
        organizationName: "New Org Name",
        avatarUrl: null,
      });
      expect(defaultProps.onSaved).toHaveBeenCalledWith({
        name: "New Org Name",
        avatarUrl: null,
      });
    });
  });

  it("validates password mismatch on Password tab", async () => {
    const user = userEvent.setup();
    render(<EditProfileModal {...defaultProps} />);

    // Switch to password tab
    await user.click(screen.getByRole("button", { name: /Password & Security/i }));

    await user.type(
      screen.getByPlaceholderText(/Enter your current password/i),
      "CurrentPass123"
    );
    await user.type(screen.getByPlaceholderText(/Minimum 6 characters/i), "NewPass123");
    await user.type(screen.getByPlaceholderText(/Re-enter new password/i), "DifferentPass123");

    await user.click(screen.getByRole("button", { name: /Update Password/i }));

    expect(screen.getByText(/New passwords do not match/i)).toBeInTheDocument();
    expect(userActions.changeUserPasswordAction).not.toHaveBeenCalled();
  });

  it("submits valid password change and displays success feedback", async () => {
    const user = userEvent.setup();
    vi.mocked(userActions.changeUserPasswordAction).mockResolvedValue({
      status: "success",
      message: "Password updated successfully!",
    });

    render(<EditProfileModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Password & Security/i }));

    await user.type(
      screen.getByPlaceholderText(/Enter your current password/i),
      "CurrentPass123"
    );
    await user.type(screen.getByPlaceholderText(/Minimum 6 characters/i), "NewPass123");
    await user.type(screen.getByPlaceholderText(/Re-enter new password/i), "NewPass123");

    await user.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(userActions.changeUserPasswordAction).toHaveBeenCalledWith({
        currentPassword: "CurrentPass123",
        newPassword: "NewPass123",
      });
      expect(screen.getByText(/Password updated successfully!/i)).toBeInTheDocument();
    });
  });

  it("calls signOut when Logout button is clicked in modal", async () => {
    const user = userEvent.setup();
    render(<EditProfileModal {...defaultProps} />);

    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    await user.click(logoutBtn);

    expect(authActions.signOut).toHaveBeenCalled();
  });
});
