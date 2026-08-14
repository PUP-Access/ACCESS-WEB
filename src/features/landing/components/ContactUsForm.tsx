"use client";

import { useState, useTransition } from "react";
import ContactSuccessModal from "./ContactSuccessModal";
import { submitContactMessageAction } from "@/features/landing/services/contact.actions";
import { getClientActionErrorMessage } from "@/lib/client-action-errors";

type ContactFormData = {
  fullName: string;
  email: string;
  courseYearSection: string;
  contactNumber: string;
  organization: string;
  purpose: string;
  concern: string;
};

const INITIAL_FORM: ContactFormData = {
  fullName: "",
  email: "",
  courseYearSection: "",
  contactNumber: "",
  organization: "",
  purpose: "",
  concern: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;
const PH_NUMBER_PATTERN = /^[9]\d{9}$/;

type FormErrors = Partial<Record<keyof ContactFormData | "form", string>>;

const glassCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35), 0 0 30px rgba(242, 98, 35, 0.12)",
};

function validateForm(form: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.courseYearSection.trim()) errors.courseYearSection = "Course, year, and section is required.";
  
  if (!form.contactNumber.trim()) {
    errors.contactNumber = "Contact number is required.";
  } else if (!PH_NUMBER_PATTERN.test(form.contactNumber.trim())) {
    errors.contactNumber = "Enter a valid PH number starting with 9 (e.g. 9123456789).";
  }

  if (!form.organization.trim()) errors.organization = "Organization is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (!form.concern.trim()) {
    errors.concern = "Concern is required.";
  } else if (form.concern.trim().split(/\s+/).filter(Boolean).length > 512) {
    errors.concern = "Concern cannot exceed 512 words.";
  }

  return errors;
}

type ContactUsFormProps = {
  onBack: () => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-white/90">
      {children}
      {required && <span className="text-[#FFB89A]"> *</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`w-full rounded-xl border bg-white/10 backdrop-blur-md px-3.5 py-3 text-sm text-white placeholder:text-white/50 outline-none transition-all ${
          error
            ? "border-red-400/50 ring-2 ring-red-400/30"
            : "border-white/20 hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default function ContactUsForm({ onBack }: ContactUsFormProps) {
  const [form, setForm] = useState<ContactFormData>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateField = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
  };

  const clearForm = () => {
    setForm(INITIAL_FORM);
    setFieldErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors({ ...errors, form: "Please complete all required fields before submitting." });
      return;
    }

    setFieldErrors({});
    const formData = new FormData();
    formData.set("fullName", form.fullName);
    formData.set("email", form.email);
    formData.set("courseYearSection", form.courseYearSection);
    formData.set("contactNumber", `+63 ${form.contactNumber}`);
    formData.set("organization", form.organization);
    formData.set("purpose", form.purpose);
    formData.set("concern", form.concern);

    startTransition(async () => {
      try {
        const result = await submitContactMessageAction({ status: "idle" }, formData);
        if (result.status === "error") {
          setFieldErrors({ form: result.message });
          return;
        }
        setShowSuccess(true);
      } catch (error) {
        setFieldErrors({
          form: getClientActionErrorMessage(error, "Failed to submit message"),
        });
      }
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearForm();
    onBack();
  };

  return (
    <>
      <div
        className="relative w-full max-w-3xl rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-left"
        style={glassCardStyle}
      >
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-wide title-header">
            Contact Us
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Reach out to ACCESS anytime for inquiries, assistance, and concerns.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8">
          {fieldErrors.form && (
            <p className="mb-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100" role="alert">
              {fieldErrors.form}
            </p>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <TextInput
                  value={form.fullName}
                  onChange={(v) => updateField("fullName", v)}
                  placeholder="Last Name First Name"
                  error={fieldErrors.fullName}
                />
              </div>
              <div>
                <FieldLabel required>Email</FieldLabel>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                  placeholder="e.g. juandelacruz@gmail.com"
                  error={fieldErrors.email}
                />
              </div>
              <div>
                <FieldLabel required>Course, Year, and Section</FieldLabel>
                <TextInput
                  value={form.courseYearSection}
                  onChange={(v) => updateField("courseYearSection", v)}
                  placeholder="e.g. BSCpE 3-7"
                  error={fieldErrors.courseYearSection}
                />
              </div>
              <div>
                <FieldLabel required>Contact Number</FieldLabel>
                <div className="flex gap-2 items-start">
                  <div className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-3 text-sm font-semibold text-white/90 shadow-sm shrink-0">
                    <span>🇵🇭</span>
                    <span>+63</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={form.contactNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                        updateField("contactNumber", cleaned);
                      }}
                      placeholder="912 345 6789"
                      aria-invalid={!!fieldErrors.contactNumber}
                      className={`w-full rounded-xl border bg-white/10 backdrop-blur-md px-3.5 py-3 text-sm text-white placeholder:text-white/50 outline-none transition-all ${
                        fieldErrors.contactNumber
                          ? "border-red-400/50 ring-2 ring-red-400/30"
                          : "border-white/20 hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
                      }`}
                    />
                  </div>
                </div>
                {fieldErrors.contactNumber && (
                  <p className="mt-1.5 text-xs text-red-300">{fieldErrors.contactNumber}</p>
                )}
              </div>
              <div>
                <FieldLabel required>Organization</FieldLabel>
                <TextInput
                  value={form.organization}
                  onChange={(v) => updateField("organization", v)}
                  placeholder="e.g. Engineering Spectrum"
                  error={fieldErrors.organization}
                />
              </div>
              <div>
                <FieldLabel required>Purpose</FieldLabel>
                <TextInput
                  value={form.purpose}
                  onChange={(v) => updateField("purpose", v)}
                  placeholder="e.g. For CE Month"
                  error={fieldErrors.purpose}
                />
              </div>
            </div>
            <div>
              <FieldLabel required>Concern</FieldLabel>
              <div>
                <textarea
                  value={form.concern}
                  onChange={(e) => updateField("concern", e.target.value)}
                  placeholder="Type here..."
                  rows={4}
                  aria-invalid={!!fieldErrors.concern}
                  className={`w-full resize-none rounded-xl border bg-white/10 backdrop-blur-md px-3.5 py-3 text-sm text-white placeholder:text-white/50 outline-none transition-all ${
                    fieldErrors.concern
                      ? "border-red-400/50 ring-2 ring-red-400/30"
                      : "border-white/20 hover:border-orange-500/40 hover:bg-white/15 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
                  }`}
                />
                {fieldErrors.concern && (
                  <p className="mt-1.5 text-xs text-red-300">{fieldErrors.concern}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 cursor-pointer"
                style={{ background: "rgba(60, 30, 20, 0.85)" }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-95 hover:shadow-[0_6px_20px_rgba(242,98,35,0.5)] disabled:opacity-60 cursor-pointer"
                style={{
                  background: "#F26223",
                  boxShadow: "0 4px 16px rgba(242,98,35,0.35)",
                }}
              >
                {isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
            <button
              type="button"
              onClick={clearForm}
              className="text-sm font-medium text-white/90 underline-offset-2 transition-colors hover:text-white hover:underline cursor-pointer"
            >
              Clear Request
            </button>
          </div>
        </form>
      </div>

      {showSuccess && <ContactSuccessModal onClose={handleSuccessClose} />}
    </>
  );
}
