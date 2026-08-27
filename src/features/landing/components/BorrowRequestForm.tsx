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
  currentItemQuantity: number | "";
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

type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
  available?: number;
};

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: (string | DropdownOption)[];
  placeholder?: string;
  error?: string;
  className?: string;
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

  const normalizedOptions: DropdownOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl border bg-white/10 backdrop-blur-md px-3.5 py-3 text-sm text-left text-white flex items-center justify-between transition-all cursor-pointer ${
          error
            ? "border-red-400/50 ring-2 ring-red-400/30"
            : isOpen
            ? "border-[#F26223] ring-2 ring-[#F26223]/30 bg-white/15"
            : "border-white/20 hover:border-orange-500/40 hover:bg-white/15"
        }`}
      >
        <span className={`truncate ${selectedOption ? "text-white font-medium" : "text-white/50"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-white/60 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#F26223]" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-b from-[#221008]/98 via-[#1a0c06]/98 to-[#120603]/98 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(242,98,35,0.2)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent">
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-white/40 text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt, i) => {
              const isDisabled = Boolean(opt.disabled);
              const isSelected = opt.value === value;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-2 ${
                    isDisabled
                      ? "opacity-35 cursor-not-allowed text-white/40 bg-transparent"
                      : isSelected
                      ? "bg-gradient-to-r from-[#F26223]/35 to-[#F26223]/10 text-orange-200 font-semibold border-l-2 border-[#F26223] shadow-sm"
                      : "text-white/85 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-transparent hover:text-white cursor-pointer"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 text-[#F26223] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

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

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = toDateTime(form.startDate, form.startHour, form.startMinute, form.startPeriod);
      const end = toDateTime(form.endDate, form.endHour, form.endMinute, form.endPeriod);
      if (start && end && end <= start) {
        const newEnd = new Date(start.getTime() + 30 * 60000);
        const offset = newEnd.getTimezoneOffset();
        const adjustedDateStr = new Date(newEnd.getTime() - offset * 60000).toISOString().split("T")[0];
        let h24 = newEnd.getHours();
        const m = newEnd.getMinutes();
        const period = h24 >= 12 ? "PM" : "AM";
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        
        setForm((prev) => ({
          ...prev,
          endDate: adjustedDateStr,
          endHour: String(h12).padStart(2, "0"),
          endMinute: String(m).padStart(2, "0"),
          endPeriod: period,
        }));
        
        setFieldErrors((prev) => {
          if (!prev.endDate) return prev;
          const next = { ...prev };
          delete next.endDate;
          return next;
        });
      }
    }
  }, [form.startDate, form.startHour, form.startMinute, form.startPeriod, form.endDate, form.endHour, form.endMinute, form.endPeriod]);

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

  const handleNext = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
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
    if (step !== 2) {
      handleNext(e);
      return;
    }
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 1) {
              handleNext(e);
            } else {
              handleSubmit(e);
            }
          }}
          noValidate
          className="mt-8"
        >
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
                        className={`w-full rounded-lg border bg-white/10 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:bg-white/20 ${
                          fieldErrors.contactNumber
                            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/50"
                            : "border-white/20 hover:border-white/30 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
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
                  className="w-full resize-none rounded-lg border bg-white/10 backdrop-blur-md px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none transition-colors border-white/20 hover:border-white/30 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr_76px_auto] items-end">
                  <div className="w-full min-w-0">
                    <FieldLabel>Choose category</FieldLabel>
                    <CustomDropdown
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
                  <div className="w-full min-w-0">
                    <FieldLabel>Choose item</FieldLabel>
                    <CustomDropdown
                      value={form.currentItem}
                      onChange={(v) => {
                        updateField("currentItem", v);
                        updateField("currentItemQuantity", 1);
                      }}
                      options={
                        equipments.find((g) => g.group === form.currentItemCategory)?.items.map(i => ({
                          value: i.name,
                          label: `${i.name} (${i.available > 0 ? `${i.available} available` : 'Not available'})`,
                          disabled: i.available === 0,
                          available: i.available,
                        })) || []
                      }
                      placeholder={form.currentItemCategory ? "Select an item" : "Select a category first"}
                      className="w-full"
                    />
                  </div>

                  <div className="w-full min-w-0">
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
                        const raw = e.target.value;
                        if (raw === "") {
                          updateField("currentItemQuantity", "");
                          return;
                        }
                        let val = parseInt(raw, 10);
                        if (isNaN(val)) return;
                        const max = equipments
                          .find(g => g.group === form.currentItemCategory)
                          ?.items.find(i => i.name === form.currentItem)?.available || 1;
                        if (val > max) val = max;
                        updateField("currentItemQuantity", val);
                      }}
                      onBlur={() => {
                        if (form.currentItemQuantity === "" || form.currentItemQuantity < 1) {
                          updateField("currentItemQuantity", 1);
                        }
                      }}
                      className="w-full rounded-lg border bg-white/10 backdrop-blur-md px-3 py-2.5 text-center text-sm text-white placeholder:text-white/50 outline-none transition-colors border-white/20 hover:border-white/30 focus:bg-white/20 focus:border-[#F26223] focus:ring-2 focus:ring-[#F26223]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            { category: form.currentItemCategory, item: form.currentItem, quantity: form.currentItemQuantity || 1 }
                          ]);
                          updateField("currentItem", "");
                          updateField("currentItemQuantity", 1);
                          setFieldErrors({ ...fieldErrors, borrowItems: undefined });
                        }
                      }
                    }}
                    disabled={!form.currentItemCategory || !form.currentItem}
                    className="w-full sm:w-auto h-[46px] px-5 rounded-xl font-semibold transition-all bg-[#F26223] hover:bg-[#F26223]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(242,98,35,0.3)] shrink-0 cursor-pointer"
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
                  <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 backdrop-blur-md">
                    <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{fieldErrors.borrowItems}</span>
                  </div>
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
            minDateObj={toDateTime(startDate, startHour, startMinute, startPeriod)}
            onDateChange={onEndDateChange}
            onHourChange={onEndHourChange}
            onMinuteChange={onEndMinuteChange}
            onPeriodChange={onEndPeriodChange}
          />
        </div>
      </div>
      {(startDateError || endDateError) && (
        <div className="mt-2.5 flex flex-col gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 backdrop-blur-md">
          {startDateError && (
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{startDateError}</span>
            </div>
          )}
          {endDateError && endDateError !== startDateError && (
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{endDateError}</span>
            </div>
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
  minDateObj,
  onDateChange,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  onClose,
}: any) {
  const [viewDate, setViewDate] = useState(() => (date ? new Date(date) : new Date()));

  const minDateStr = minDateObj ? new Date(minDateObj.getTime() - minDateObj.getTimezoneOffset() * 60000).toISOString().split("T")[0] : null;
  const minH24 = minDateObj ? minDateObj.getHours() : null;
  const minMInt = minDateObj ? minDateObj.getMinutes() : null;

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
      className="flex flex-col sm:flex-row bg-gradient-to-b from-[#221008]/98 via-[#180c06]/98 to-[#120603]/98 text-white border border-orange-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(242,98,35,0.2)] backdrop-blur-2xl p-5 gap-5 sm:gap-6 w-[300px] sm:w-[480px] mt-2 origin-top-left animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Calendar */}
      <div className="w-full sm:w-[270px] shrink-0">
        <div className="flex justify-between items-center mb-4 px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-orange-500/20 rounded-xl text-white/60 hover:text-orange-300 ring-1 ring-white/10 hover:ring-orange-500/30 transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-300">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-orange-500/20 rounded-xl text-white/60 hover:text-orange-300 ring-1 ring-white/10 hover:ring-orange-500/30 transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-[11px] font-bold text-orange-300/75 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
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
            const isToday = adjustedDateStr === todayStr;
            const isPastDate =
              adjustedDateStr < todayStr || (minDateStr !== null && adjustedDateStr < minDateStr);
            return (
              <button
                key={d}
                type="button"
                disabled={isPastDate}
                onClick={(e) => {
                  if (isPastDate) return;
                  handleDayClick(d, e);
                }}
                className={`h-8 w-8 sm:h-8.5 sm:w-8.5 mx-auto rounded-xl flex items-center justify-center text-xs sm:text-sm transition-all cursor-pointer ${
                  isPastDate
                    ? "opacity-25 cursor-not-allowed text-white/30"
                    : isSelected
                    ? "bg-gradient-to-br from-[#FF6B35] to-[#EB551D] text-white font-black shadow-[0_4px_16px_rgba(255,107,53,0.55)] scale-105"
                    : isToday
                    ? "text-orange-300 font-bold ring-1 ring-orange-500/50 hover:bg-orange-500/20"
                    : "text-white/90 hover:bg-orange-500/20 hover:text-orange-200"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="w-full sm:w-[160px] shrink-0 border-t sm:border-t-0 sm:border-l border-orange-500/20 pt-4 sm:pt-0 sm:pl-5 flex flex-col">
        <div className="text-[11px] font-bold uppercase tracking-wider text-orange-300/80 mb-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#F26223]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
          </svg>
          Select Time
        </div>
        <div className="max-h-[220px] sm:max-h-[260px] overflow-y-auto pr-1.5 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent">
          {timeSlots.map((slot, i) => {
            const isSelected =
              slot.hour === hour && slot.minute === minute && slot.period === period;

            let isPastTime =
              date === todayStr &&
              (slot.h24 < currentHour24 || (slot.h24 === currentHour24 && slot.mInt < currentMinute));
            if (minDateStr && date === minDateStr) {
              if (slot.h24 < minH24! || (slot.h24 === minH24 && slot.mInt <= minMInt!)) {
                isPastTime = true;
              }
            }

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
                  if (date) onClose();
                }}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm transition-all text-center border font-medium ${
                  isPastTime
                    ? "opacity-25 cursor-not-allowed border-transparent text-white/30"
                    : isSelected
                    ? "bg-gradient-to-r from-[#FF6B35] to-[#EB551D] text-white border-transparent font-bold shadow-[0_4px_14px_rgba(255,107,53,0.5)]"
                    : "border-white/10 text-white/85 bg-white/[0.04] hover:border-orange-500/40 hover:bg-orange-500/20 hover:text-white cursor-pointer"
                }`}
              >
                {slot.display}
              </button>
            );
          })}
        </div>
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
  minDateObj,
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
  minDateObj?: Date | null;
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
        className={`relative flex items-center bg-white/10 backdrop-blur-md border rounded-xl px-4 py-3.5 transition-all w-full cursor-pointer ${
          dateError
            ? "border-red-400/50 ring-2 ring-red-400/30"
            : isOpen
            ? "border-[#F26223] ring-2 ring-[#F26223]/30 bg-white/15"
            : "border-white/20 hover:border-orange-500/40 hover:bg-white/15"
        }`}
      >
        <CalendarIcon className="w-5 h-5 text-orange-400/80 mr-3 shrink-0" />
        <span className="flex-1 text-left text-white font-medium text-[14px]">
          {date
            ? `${formatDateDisplay(date)}${
                hour && minute && period ? ` at ${hour}:${minute} ${period}` : ""
              }`
            : "Select Date and Time"}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-white/50 shrink-0 ml-2 pointer-events-none transition-transform duration-200 ${isOpen ? "rotate-180 text-[#F26223]" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2">
          <CustomDateTimePickerPopover
            date={date}
            hour={hour}
            minute={minute}
            period={period}
            minDateObj={minDateObj}
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
