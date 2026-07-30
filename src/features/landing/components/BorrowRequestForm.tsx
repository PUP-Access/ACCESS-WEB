"use client";

import { useCallback, useRef, useState, useEffect, useTransition } from "react";
import BorrowSuccessModal from "./BorrowSuccessModal";
import { submitBorrowRequestAction } from "@/features/landing/services/borrow.actions";
import { getClientActionErrorMessage } from "@/lib/client-action-errors";

export type BorrowFormData = {
  fullName: string;
  email: string;
  courseYearSection: string;
  contactNumber: string;
  organization: string;
  purpose: string;
  additionalInfo: string;
  currentItemCategory: string;
  currentItem: string;
  currentItemQuantity: number;
  borrowItems: { category: string; item: string; quantity: number }[];
  startDate: string;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  endPeriod: string;
  letterFile: File | null;
};

const INITIAL_FORM: BorrowFormData = {
  fullName: "",
  email: "",
  courseYearSection: "",
  contactNumber: "",
  organization: "",
  purpose: "",
  additionalInfo: "",
  currentItemCategory: "",
  currentItem: "",
  currentItemQuantity: 1,
  borrowItems: [],
  startDate: "",
  startHour: "01",
  startMinute: "30",
  startPeriod: "AM",
  endDate: "",
  endHour: "01",
  endMinute: "30",
  endPeriod: "AM",
  letterFile: null,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;
const PH_NUMBER_PATTERN = /^[9]\d{9}$/;

type FormErrors = Partial<Record<keyof BorrowFormData | "form", string>>;

function toDateTime(
  date: string,
  hour: string,
  minute: string,
  period: string
): Date | null {
  if (!date) return null;
  let h = parseInt(hour, 10);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, h, parseInt(minute, 10));
}

function validateStep1(form: BorrowFormData): FormErrors {
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

  return errors;
}

function validateStep2(form: BorrowFormData): FormErrors {
  const errors: FormErrors = {};

  if ((form.borrowItems || []).length === 0) errors.borrowItems = "Please add at least one item to borrow.";
  if (!form.startDate) errors.startDate = "Start date is required.";
  if (!form.endDate) errors.endDate = "End date is required.";

  if (form.startDate && form.endDate) {
    const start = toDateTime(form.startDate, form.startHour, form.startMinute, form.startPeriod);
    const end = toDateTime(form.endDate, form.endHour, form.endMinute, form.endPeriod);
    if (start && end && end <= start) {
      errors.endDate = "End date and time must be after the start.";
    }
  }

  return errors;
}

type BorrowRequestFormProps = {
  onBackToLanding: () => void;
  equipments?: { group: string; items: { name: string; available: number; unit?: string | null }[] }[];
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-white/90">
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
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-white/10 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:bg-white/20 ${
          error ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/50" : "border-white/20 hover:border-white/30 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  className = "",
  placeholder,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: (string | { value: string; label: string; disabled?: boolean } | { group: string; items: (string | { value: string; label: string; disabled?: boolean })[] })[];
  className?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full rounded-lg border bg-white/10 backdrop-blur-md px-2 py-2.5 text-sm text-white outline-none transition-colors focus:bg-white/20 ${
          error ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/50" : "border-white/20 hover:border-white/30 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
        } ${className}`}
      >
        {placeholder && (
          <option value="" disabled className="text-gray-900 bg-white">
            {placeholder}
          </option>
        )}
        {options.map((opt, i) => {
          if (typeof opt === "string") {
            return (
              <option key={opt} value={opt} className="text-gray-900 bg-white">
                {opt}
              </option>
            );
          }
          if ('value' in opt) {
            return (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-gray-900 bg-white disabled:text-gray-400 disabled:bg-gray-100">
                {opt.label}
              </option>
            );
          }
          return (
            <optgroup key={opt.group} label={opt.group} className="text-gray-900 bg-gray-100 font-bold">
              {opt.items.map((item) => {
                if (typeof item === "string") {
                  return (
                    <option key={item} value={item} className="text-gray-900 bg-white font-normal">
                      {item}
                    </option>
                  );
                }
                return (
                  <option key={item.value} value={item.value} disabled={item.disabled} className="text-gray-900 bg-white font-normal disabled:text-gray-400 disabled:bg-gray-100">
                    {item.label}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"];

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const glassCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
};

export default function BorrowRequestForm({ onBackToLanding, equipments = [] }: BorrowRequestFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<BorrowFormData>(INITIAL_FORM);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof BorrowFormData>(key: K, value: BorrowFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (file.type !== "application/pdf" && ext !== "pdf") {
      return "Upload only PDF files.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File must be 5 MB or smaller.";
    }
    return null;
  };

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      updateField("letterFile", null);
      setFileError(null);
      return;
    }
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      updateField("letterFile", null);
      return;
    }
    setFileError(null);
    updateField("letterFile", file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearForm = () => {
    setForm(INITIAL_FORM);
    setStep(1);
    setFileError(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBack = () => {
    if (step === 2) {
      setFieldErrors({});
      setStep(1);
    } else {
      onBackToLanding();
    }
  };

  const handleNext = () => {
    const errors = validateStep1(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors({ ...errors, form: "Please complete all required fields before continuing." });
      return;
    }
    setFieldErrors({});
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateStep2(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors({ ...errors, form: "Please complete all required fields before submitting." });
      return;
    }
    if (!form.letterFile) {
      setFieldErrors({ form: "Request letter file is required." });
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
    formData.set("additionalInfo", form.additionalInfo);
    
    const combinedItems = (form.borrowItems || []).map(i => `${i.item} x${i.quantity} (${i.category})`).join(", ");
    formData.set("item", combinedItems);
    formData.set("startDate", form.startDate);
    formData.set("startHour", form.startHour);
    formData.set("startMinute", form.startMinute);
    formData.set("startPeriod", form.startPeriod);
    formData.set("endDate", form.endDate);
    formData.set("endHour", form.endHour);
    formData.set("endMinute", form.endMinute);
    formData.set("endPeriod", form.endPeriod);
    formData.set("letterFile", form.letterFile);

    startTransition(async () => {
      try {
        const result = await submitBorrowRequestAction({ status: "idle" }, formData);
        if (result.status === "error") {
          setFieldErrors({ form: result.message });
          return;
        }
        setShowSuccess(true);
      } catch (error) {
        setFieldErrors({
          form: getClientActionErrorMessage(error, "Failed to submit borrow request"),
        });
      }
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearForm();
    onBackToLanding();
  };

  return (
    <>
      <div
        className="relative w-full max-w-3xl rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-left"
        style={glassCardStyle}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Step {step} of 2
          </p>
          <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-wide title-header">
            Borrow Equipments
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Submit your request easily and track your borrowing anytime, anywhere.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8">
          {fieldErrors.form && (
            <p className="mb-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100" role="alert">
              {fieldErrors.form}
            </p>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <TextInput
                    value={form.fullName}
                    onChange={(v) => updateField("fullName", v)}
                    placeholder="Last Name First Name"
                    error={fieldErrors.fullName}
                    required
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
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Course, Year, and Section</FieldLabel>
                  <TextInput
                    value={form.courseYearSection}
                    onChange={(v) => updateField("courseYearSection", v)}
                    placeholder="e.g. BSCpE 3-7"
                    error={fieldErrors.courseYearSection}
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Contact Number</FieldLabel>
                  <div className="flex gap-2 items-start">
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white/20 px-3 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-white/10 w-[80px]">
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
                        className={`w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 ${
                          fieldErrors.contactNumber
                            ? "ring-2 ring-red-400 focus:ring-red-400"
                            : "focus:ring-[#F26223]/50"
                        }`}
                      />
                    </div>
                  </div>
                  {fieldErrors.contactNumber && (
                    <p className="mt-1 text-xs text-red-300">{fieldErrors.contactNumber}</p>
                  )}
                </div>
                <div>
                  <FieldLabel required>Organization</FieldLabel>
                  <TextInput
                    value={form.organization}
                    onChange={(v) => updateField("organization", v)}
                    placeholder="e.g. Engineering Spectrum"
                    error={fieldErrors.organization}
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Purpose</FieldLabel>
                  <TextInput
                    value={form.purpose}
                    onChange={(v) => updateField("purpose", v)}
                    placeholder="e.g. For CE Month"
                    error={fieldErrors.purpose}
                    required
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Additional Information</FieldLabel>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => updateField("additionalInfo", e.target.value)}
                  placeholder="Type here..."
                  rows={4}
                  className="w-full resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#F26223]/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <FieldLabel>Choose category</FieldLabel>
                    <SelectInput
                      value={form.currentItemCategory}
                      onChange={(v) => {
                        updateField("currentItemCategory", v);
                        updateField("currentItem", "");
                        updateField("currentItemQuantity", 1);
                      }}
                      options={equipments.map((g) => g.group)}
                      placeholder="Select a category"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <FieldLabel>Choose item</FieldLabel>
                    <SelectInput
                      value={form.currentItem}
                      onChange={(v) => {
                        updateField("currentItem", v);
                        updateField("currentItemQuantity", 1);
                      }}
                      options={
                        equipments.find((g) => g.group === form.currentItemCategory)?.items.map(i => ({
                          value: i.name,
                          label: `${i.name} (${i.available > 0 ? `${i.available} available` : 'Not available'})`,
                          disabled: i.available === 0
                        })) || []
                      }
                      placeholder="Select an item"
                      className="w-full"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <FieldLabel>Qty</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      max={
                        equipments
                          .find(g => g.group === form.currentItemCategory)
                          ?.items.find(i => i.name === form.currentItem)?.available || 1
                      }
                      value={form.currentItemQuantity}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val < 1) val = 1;
                        const max = equipments
                          .find(g => g.group === form.currentItemCategory)
                          ?.items.find(i => i.name === form.currentItem)?.available || 1;
                        if (val > max) val = max;
                        updateField("currentItemQuantity", val);
                      }}
                      className="w-full rounded-lg border bg-white/10 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none transition-colors border-white/20 hover:border-white/30 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (form.currentItemCategory && form.currentItem) {
                        const exists = (form.borrowItems || []).some(
                          (i) => i.category === form.currentItemCategory && i.item === form.currentItem
                        );
                        if (!exists) {
                          updateField("borrowItems", [
                            ...(form.borrowItems || []),
                            { category: form.currentItemCategory, item: form.currentItem, quantity: form.currentItemQuantity }
                          ]);
                          updateField("currentItem", "");
                          updateField("currentItemQuantity", 1);
                          setFieldErrors({ ...fieldErrors, borrowItems: undefined });
                        }
                      }
                    }}
                    disabled={!form.currentItemCategory || !form.currentItem}
                    className="w-full sm:w-auto h-[46px] px-6 rounded-xl font-semibold transition-all bg-[#F26223] hover:bg-[#F26223]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(242,98,35,0.3)] shrink-0"
                  >
                    Add
                  </button>
                </div>
                
                {/* List of chosen items */}
                {(form.borrowItems || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(form.borrowItems || []).map((bi, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-sm shadow-sm transition-all">
                        <span className="font-medium">{bi.item}</span>
                        <span className="text-[#F26223] font-bold px-1.5 py-0.5 bg-black/20 rounded-md text-xs">x{bi.quantity}</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">({bi.category})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = (form.borrowItems || []).filter((_, i) => i !== idx);
                            updateField("borrowItems", newItems);
                          }}
                          className="ml-1 p-1 -mr-1 rounded-md text-white/50 hover:bg-white/10 hover:text-red-400 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {fieldErrors.borrowItems && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.borrowItems}</p>
                )}
              </div>

              <div>
                <FieldLabel required>Set Date and Time</FieldLabel>
                <DateTimeRange
                  startDate={form.startDate}
                  startHour={form.startHour}
                  startMinute={form.startMinute}
                  startPeriod={form.startPeriod}
                  endDate={form.endDate}
                  endHour={form.endHour}
                  endMinute={form.endMinute}
                  endPeriod={form.endPeriod}
                  startDateError={fieldErrors.startDate}
                  endDateError={fieldErrors.endDate}
                  onStartDateChange={(v) => updateField("startDate", v)}
                  onStartHourChange={(v) => updateField("startHour", v)}
                  onStartMinuteChange={(v) => updateField("startMinute", v)}
                  onStartPeriodChange={(v) => updateField("startPeriod", v)}
                  onEndDateChange={(v) => updateField("endDate", v)}
                  onEndHourChange={(v) => updateField("endHour", v)}
                  onEndMinuteChange={(v) => updateField("endMinute", v)}
                  onEndPeriodChange={(v) => updateField("endPeriod", v)}
                />
              </div>

              <div>
                <FieldLabel>Upload Letter</FieldLabel>
                {form.letterFile ? (
                  <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mt-2 transition-all shadow-lg">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/20 text-red-400 shrink-0 border border-red-500/30">
                        <span className="font-bold text-xs tracking-wider">PDF</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate" title={form.letterFile.name}>
                          {form.letterFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/50">{(form.letterFile.size / 1024).toFixed(0)} KB</span>
                          <span className="text-xs text-white/50">•</span>
                          <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button 
                        type="button"
                        onClick={() => {
                          const url = URL.createObjectURL(form.letterFile as File);
                          window.open(url, '_blank');
                        }}
                        className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Preview File"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleFile(null)}
                        className="p-2.5 text-white/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Remove File"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                      isDragging
                        ? "border-[#F26223] bg-white/10"
                        : "border-white/50 bg-white/5 hover:bg-white/10 hover:border-white/70 cursor-pointer"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      className="mb-3 text-white/80"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-white/90">Choose a file or drag and drop it here</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-4 rounded-full px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
                      style={{ background: "rgba(255, 255, 255, 0.15)" }}
                    >
                      Choose File
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {fileError && <p className="mt-2 text-xs text-red-300">{fileError}</p>}
                <p className="mt-2 text-xs text-white/70">
                  Note: Upload only PDF file (Max 5mb)
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: "rgba(60, 30, 20, 0.85)" }}
              >
                Back
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-95 hover:shadow-[0_6px_20px_rgba(242,98,35,0.5)]"
                  style={{
                    background: "#F26223",
                    boxShadow: "0 4px 16px rgba(242,98,35,0.35)",
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-95 hover:shadow-[0_6px_20px_rgba(242,98,35,0.5)] disabled:opacity-60"
                  style={{
                    background: "#F26223",
                    boxShadow: "0 4px 16px rgba(242,98,35,0.35)",
                  }}
                >
                  {isPending ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={clearForm}
              className="text-sm font-medium text-white/90 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Clear Request
            </button>
          </div>
        </form>
      </div>

      {showSuccess && <BorrowSuccessModal onClose={handleSuccessClose} />}
    </>
  );
}

function DateTimeRange({
  startDate,
  startHour,
  startMinute,
  startPeriod,
  endDate,
  endHour,
  endMinute,
  endPeriod,
  startDateError,
  endDateError,
  onStartDateChange,
  onStartHourChange,
  onStartMinuteChange,
  onStartPeriodChange,
  onEndDateChange,
  onEndHourChange,
  onEndMinuteChange,
  onEndPeriodChange,
}: {
  startDate: string;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  endPeriod: string;
  startDateError?: string;
  endDateError?: string;
  onStartDateChange: (v: string) => void;
  onStartHourChange: (v: string) => void;
  onStartMinuteChange: (v: string) => void;
  onStartPeriodChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onEndHourChange: (v: string) => void;
  onEndMinuteChange: (v: string) => void;
  onEndPeriodChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">Start</span>
          <DateTimeGroup
            date={startDate}
            hour={startHour}
            minute={startMinute}
            period={startPeriod}
            dateError={startDateError}
            onDateChange={onStartDateChange}
            onHourChange={onStartHourChange}
            onMinuteChange={onStartMinuteChange}
            onPeriodChange={onStartPeriodChange}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">End</span>
          <DateTimeGroup
            date={endDate}
            hour={endHour}
            minute={endMinute}
            period={endPeriod}
            dateError={endDateError}
            onDateChange={onEndDateChange}
            onHourChange={onEndHourChange}
            onMinuteChange={onEndMinuteChange}
            onPeriodChange={onEndPeriodChange}
          />
        </div>
      </div>
      {(startDateError || endDateError) && (
        <div className="mt-1 space-y-0.5">
          {startDateError && <p className="text-xs text-red-300">{startDateError}</p>}
          {endDateError && endDateError !== startDateError && (
            <p className="text-xs text-red-300">{endDateError}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function CustomDateTimePickerPopover({
  date,
  hour,
  minute,
  period,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  onClose,
}: any) {
  const [viewDate, setViewDate] = useState(() => (date ? new Date(date) : new Date()));

  const now = new Date();
  const todayOffset = now.getTimezoneOffset();
  const todayStr = new Date(now.getTime() - todayOffset * 60 * 1000).toISOString().split("T")[0];
  const currentHour24 = now.getHours();
  const currentMinute = now.getMinutes();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (d: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(year, month, d);
    const offset = newDate.getTimezoneOffset();
    const adjustedDate = new Date(newDate.getTime() - offset * 60 * 1000);
    onDateChange(adjustedDate.toISOString().split("T")[0]);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      for (const m of ["00", "15", "30", "45"]) {
        const periodStr = h >= 12 ? "PM" : "AM";
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const hourStr = String(hour12).padStart(2, "0");
        const display24 = `${String(h).padStart(2, "0")}:${m}`;
        slots.push({ display: display24, hour: hourStr, minute: m, period: periodStr, h24: h, mInt: parseInt(m, 10) });
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  return (
    <div
      className="flex flex-col sm:flex-row bg-[#151515] text-white border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-5 gap-4 sm:gap-6 w-[280px] sm:w-[460px] mt-2 origin-top-left"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Calendar */}
      <div className="w-full sm:w-[260px] shrink-0">
        <div className="flex justify-between items-center mb-4 px-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="text-white font-medium text-[14px]">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[11px] font-medium text-white/40">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const curDate = new Date(year, month, d);
            const offset = curDate.getTimezoneOffset();
            const adjustedDateStr = new Date(curDate.getTime() - offset * 60 * 1000)
              .toISOString()
              .split("T")[0];
            const isSelected = adjustedDateStr === date;
            const isPastDate = adjustedDateStr < todayStr;
            return (
              <button
                key={d}
                type="button"
                disabled={isPastDate}
                onClick={(e) => {
                  if (isPastDate) return;
                  handleDayClick(d, e);
                }}
                className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-sm transition-all ${
                  isPastDate
                    ? "opacity-30 cursor-not-allowed text-white/50"
                    : isSelected
                    ? "bg-white text-black font-semibold"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="w-full sm:w-[150px] shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {timeSlots.map((slot, i) => {
          const isSelected =
            slot.hour === hour && slot.minute === minute && slot.period === period;
          
          const isPastTime = date === todayStr && (slot.h24 < currentHour24 || (slot.h24 === currentHour24 && slot.mInt < currentMinute));

          return (
            <button
              key={i}
              type="button"
              disabled={isPastTime}
              onClick={(e) => {
                if (isPastTime) return;
                e.stopPropagation();
                onHourChange(slot.hour);
                onMinuteChange(slot.minute);
                onPeriodChange(slot.period);
                if (date) onClose(); // Auto-close if date is also selected
              }}
              className={`py-2 px-3 rounded-lg text-sm transition-all text-center border ${
                isPastTime
                  ? "opacity-30 cursor-not-allowed border-transparent text-white/50"
                  : isSelected
                  ? "bg-white text-black border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                  : "border-transparent text-white/90 bg-white/5 hover:border-white/10 hover:bg-white/10"
              }`}
            >
              {slot.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateTimeGroup({
  date,
  hour,
  minute,
  period,
  dateError,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: {
  date: string;
  hour: string;
  minute: string;
  period: string;
  dateError?: string;
  onDateChange: (v: string) => void;
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  onPeriodChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Select Date";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center bg-white/10 backdrop-blur-md border rounded-xl px-4 py-3.5 transition-colors w-full focus-within:bg-white/20 focus-within:border-[#F26223] ${
          dateError ? "border-red-400/50" : "border-white/20 hover:border-white/30"
        }`}
      >
        <CalendarIcon className="w-5 h-5 text-white/70 mr-3 shrink-0" />
        <span className="flex-1 text-left text-white font-medium text-[15px]">
          {date
            ? `${formatDateDisplay(date)}${
                hour && minute && period ? ` at ${hour}:${minute} ${period}` : ""
              }`
            : "Select Date and Time"}
        </span>
        <ChevronDownIcon className="w-5 h-5 text-white/50 shrink-0 ml-2 pointer-events-none" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2">
          <CustomDateTimePickerPopover
            date={date}
            hour={hour}
            minute={minute}
            period={period}
            onDateChange={onDateChange}
            onHourChange={onHourChange}
            onMinuteChange={onMinuteChange}
            onPeriodChange={onPeriodChange}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
