import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your ACCESS account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black-50 p-4">
      <div className="w-full max-w-md p-8 bg-black rounded-xl shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your email and we&#39ll send you a link to get back into your account.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link 
            href="/auth/login" 
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}