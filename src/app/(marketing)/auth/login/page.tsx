import LoginScreen from "@/features/auth/components/LoginScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to the PUP ACCESS portal to borrow equipment or manage your organization account.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
