import SignUpScreen from "@/features/auth/components/SignUpScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an organization account on the PUP ACCESS portal.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <SignUpScreen />;
}
