import RoleSelectionScreen from "@/features/auth/components/RoleSelectionScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Choose how to sign in to the PUP ACCESS portal.",
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return <RoleSelectionScreen />;
}
