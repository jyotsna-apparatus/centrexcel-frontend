"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { hackathonImageSrc } from "@/components/hackathon-card/HackathonCard";
import { RequiredFieldMark } from "@/components/required-field-mark";
import { UploadRequirementHint } from "@/components/upload-requirement-hint";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/auth-context";
import {
  confirmEmailChange,
  confirmPasswordChange,
  requestEmailChange,
  requestPasswordChangeOtp,
  type ParticipantGenderValue,
  type UpdateProfileBody,
  updateProfile,
  updateProfilePicture,
} from "@/lib/auth-api";
import { ROLES } from "@/types/roles";
import { cn, FIELD_ERROR_INPUT_CLASS } from "@/lib/utils";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/lib/validate";

const PROFILE_ACCEPT = "image/png,image/webp,image/jpeg,image/jpg";
const MAX_BIO_LEN = 1000;
const MAX_PROFILE_FILE = 2 * 1024 * 1024;

const OTP_LENGTH = 6;
const MAX_WORK_EXP_LEN = 2000;
const GENDER_OPTIONS: { value: ParticipantGenderValue; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function SettingsPage() {
  const { user, loadUser } = useAuth();

  // Profile
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [profileBio, setProfileBio] = useState("");
  const [profileBaseline, setProfileBaseline] = useState({
    name: "",
    username: "",
    profileBio: "",
    education: "",
    profession: "",
    workExperience: "",
    age: "",
    gender: "" as ParticipantGenderValue | "",
  });
  const [profileSaveDialogOpen, setProfileSaveDialogOpen] = useState(false);
  const [education, setEducation] = useState("");
  const [profession, setProfession] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [gender, setGender] = useState<ParticipantGenderValue | "">("");

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [emailStep, setEmailStep] = useState<"form" | "otp">("form");
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // Password change
  const [passwordOtpDigits, setPasswordOtpDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStep, setPasswordStep] = useState<"idle" | "otp">("idle");
  const passwordOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [passwordResendCooldown, setPasswordResendCooldown] = useState(0);

  useEffect(() => {
    if (!user) return;
    const n = user.name ?? "";
    const u = user.username ?? "";
    const b = user.profileBio ?? "";
    const ed = user.education ?? "";
    const pr = user.profession ?? "";
    const wx = user.workExperience ?? "";
    const ag = user.age != null ? String(user.age) : "";
    const gen = (user.gender as ParticipantGenderValue | undefined) ?? "";
    setName(n);
    setUsername(u);
    setProfileBio(b);
    setEducation(ed);
    setProfession(pr);
    setWorkExperience(wx);
    setAgeInput(ag);
    const validGender = GENDER_OPTIONS.some((o) => o.value === gen)
      ? (gen as ParticipantGenderValue)
      : "";
    setGender(validGender);
    setProfileBaseline({
      name: n,
      username: u,
      profileBio: b,
      education: ed,
      profession: pr,
      workExperience: wx,
      age: ag,
      gender: validGender,
    });
  }, [user]);

  const isProfileDirty = useMemo(() => {
    const bn = profileBaseline.name.trim();
    const bu = profileBaseline.username.trim();
    const bb = profileBaseline.profileBio.trim();
    const bed = profileBaseline.education.trim();
    const bpr = profileBaseline.profession.trim();
    const bwx = profileBaseline.workExperience.trim();
    const bag = profileBaseline.age.trim();
    const bgen = profileBaseline.gender;
    return (
      name.trim() !== bn ||
      username.trim() !== bu ||
      profileBio.trim() !== bb ||
      education.trim() !== bed ||
      profession.trim() !== bpr ||
      workExperience.trim() !== bwx ||
      ageInput.trim() !== bag ||
      gender !== bgen
    );
  }, [
    name,
    username,
    profileBio,
    education,
    profession,
    workExperience,
    ageInput,
    gender,
    profileBaseline,
  ]);

  const profilePictureSrc = user ? hackathonImageSrc(user.profilePic) : null;

  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const id = setInterval(
      () => setEmailResendCooldown((s) => (s <= 1 ? 0 : s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [emailResendCooldown]);

  useEffect(() => {
    if (passwordResendCooldown <= 0) return;
    const id = setInterval(
      () => setPasswordResendCooldown((s) => (s <= 1 ? 0 : s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [passwordResendCooldown]);

  const setEmailOtpDigit = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setEmailOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1)
      emailOtpRefs.current[index + 1]?.focus();
  }, []);

  const setPasswordOtpDigit = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setPasswordOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1)
      passwordOtpRefs.current[index + 1]?.focus();
  }, []);

  const handleEmailOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const digits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => {
      if (i < OTP_LENGTH) digits[i] = c;
    });
    setEmailOtpDigits(digits);
    emailOtpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  const handlePasswordOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const digits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => {
      if (i < OTP_LENGTH) digits[i] = c;
    });
    setPasswordOtpDigits(digits);
    passwordOtpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  const profileMutation = useMutation({
    mutationFn: (body: UpdateProfileBody) => updateProfile(body),
    onSuccess: async () => {
      await loadUser();
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profilePictureMutation = useMutation({
    mutationFn: (f: File) => updateProfilePicture(f),
    onSuccess: async () => {
      await loadUser();
      toast.success("Profile picture updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestEmailMutation = useMutation({
    mutationFn: (email: string) => requestEmailChange(email),
    onSuccess: () => {
      setEmailStep("otp");
      setEmailResendCooldown(60);
      toast.success("Verification code sent to your new email");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmEmailMutation = useMutation({
    mutationFn: (body: { newEmail: string; otp: string }) =>
      confirmEmailChange(body),
    onSuccess: async () => {
      await loadUser();
      setEmailStep("form");
      setNewEmail("");
      setEmailOtpDigits(Array(OTP_LENGTH).fill(""));
      toast.success("Email updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestPasswordMutation = useMutation({
    mutationFn: () => requestPasswordChangeOtp(),
    onSuccess: () => {
      setPasswordStep("otp");
      setPasswordResendCooldown(60);
      toast.success("Verification code sent to your email");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmPasswordMutation = useMutation({
    mutationFn: (body: { otp: string; newPassword: string }) =>
      confirmPasswordChange(body),
    onSuccess: async () => {
      setPasswordStep("idle");
      setPasswordOtpDigits(Array(OTP_LENGTH).fill(""));
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      toast.success("Password changed successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onRequestSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileDirty) return;
    setUsernameError(null);
    if (username.trim()) {
      const u = validateUsername(username.trim());
      if (!u.valid) {
        setUsernameError(u.message ?? "Invalid username");
        return;
      }
    }
    setProfileSaveDialogOpen(true);
  };

  const emailChangeDisabled =
    user == null ||
    !newEmail.trim() ||
    newEmail.trim().toLowerCase() === user.email.toLowerCase();

  const executeProfileSave = async () => {
    setUsernameError(null);
    if (username.trim()) {
      const u = validateUsername(username.trim());
      if (!u.valid) {
        setUsernameError(u.message ?? "Invalid username");
        toast.error(u.message ?? "Invalid username");
        throw new Error(u.message ?? "Invalid username");
      }
    }
    const body: UpdateProfileBody = {
      name: name.trim() || null,
      username: username.trim() || null,
      profileBio: profileBio.trim(),
    };
    if (user?.role === ROLES.PARTICIPANT) {
      const ageNum = parseInt(ageInput.trim(), 10);
      if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120) {
        const msg = "Age must be a whole number between 13 and 120";
        toast.error(msg);
        throw new Error(msg);
      }
      if (!gender) {
        const msg = "Select a gender option";
        toast.error(msg);
        throw new Error(msg);
      }
      body.education = education.trim() || null;
      body.profession = profession.trim() || null;
      body.workExperience = workExperience.trim() || null;
      body.age = ageNum;
      body.gender = gender;
    }
    await profileMutation.mutateAsync(body);
  };

  const onPickProfilePicture = (f: File | null) => {
    if (!f) return;
    if (!PROFILE_ACCEPT.split(",").some((t) => f.type === t.trim())) {
      toast.error("Use PNG, WebP, or JPEG only");
      return;
    }
    if (f.size > MAX_PROFILE_FILE) {
      toast.error("Image must be 2MB or smaller");
      return;
    }
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(f);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        toast.error("Image must be at most 2000×2000 pixels");
        return;
      }
      profilePictureMutation.mutate(f);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Could not read that image");
    };
    img.src = objectUrl;
  };

  const onRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateEmail(newEmail.trim());
    if (!v.valid) {
      toast.error(v.message);
      return;
    }
    requestEmailMutation.mutate(newEmail.trim().toLowerCase());
  };

  const onConfirmEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    const otp = emailOtpDigits.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit code");
      return;
    }
    confirmEmailMutation.mutate({
      newEmail: newEmail.trim().toLowerCase(),
      otp,
    });
  };

  const onConfirmPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    const otp = passwordOtpDigits.join("");
    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit code");
      return;
    }
    const v = validatePassword(newPassword);
    if (!v.valid) {
      setPasswordError(v.message ?? "Invalid password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    confirmPasswordMutation.mutate({ otp, newPassword });
  };

  if (!user) {
    return (
      <div className="space-y-8">
        <p className="p1 text-cs-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="h2 text-cs-heading">Settings</h1>
        <p className="p1 mt-1 text-cs-text">
          Manage your account details. Email and password changes require OTP
          verification.
        </p>
      </header>

      {/* Profile: name & username */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Profile</h2>
        <form onSubmit={onRequestSaveProfile} className="space-y-4">
          {user.isOnboarded === true && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-cs-border bg-muted">
                {profilePictureSrc ? (
                  <Image
                    src={profilePictureSrc}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-cs-text">
                    No photo
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <label className="text-sm font-medium text-cs-text block">
                  Profile picture
                </label>
                <UploadRequirementHint variant="profile" className="mt-1" />
                <Input
                  type="file"
                  accept={PROFILE_ACCEPT}
                  className="cursor-pointer max-w-md"
                  disabled={profilePictureMutation.isPending}
                  onChange={(e) =>
                    onPickProfilePicture(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-cs-text mb-1.5 block">
              Name
            </label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-cs-text mb-1.5 block">
              Username
            </label>
            <Input
              type="text"
              placeholder="Username (3–30 characters)"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
              }}
              aria-invalid={!!usernameError}
              className={cn(
                "max-w-md",
                usernameError && FIELD_ERROR_INPUT_CLASS,
              )}
              maxLength={30}
            />
            {usernameError && (
              <p className="mt-1 text-sm !text-red-500">{usernameError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-cs-text mb-1.5 block">
              Bio
            </label>
            <textarea
              value={profileBio}
              onChange={(e) =>
                setProfileBio(e.target.value.slice(0, MAX_BIO_LEN))
              }
              maxLength={MAX_BIO_LEN}
              rows={4}
              placeholder="Short bio (visible on your profile)"
              className={cn(
                "placeholder:text-muted-foreground w-full min-h-[100px] rounded-md border border-cs-border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-y md:text-sm",
                "focus-visible:border-cs-primary focus-visible:ring-ring/50 focus-visible:ring-[1px]",
              )}
            />
            <p className="text-xs text-cs-text mt-1">
              {profileBio.length} / {MAX_BIO_LEN}
            </p>
          </div>

          {user.role === ROLES.PARTICIPANT ? (
            <div className="space-y-4 border-t border-cs-border pt-6">
              <div>
                <p className="text-sm font-medium text-cs-heading">
                  Participant profile
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <RequiredFieldMark /> Age and gender are required when you save
                  profile changes that include this section.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-cs-text mb-1.5 block">
                  Education
                </label>
                <Input
                  value={education}
                  onChange={(e) => setEducation(e.target.value.slice(0, 200))}
                  className="max-w-md"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-cs-text mb-1.5 block">
                  Profession
                </label>
                <Input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value.slice(0, 200))}
                  className="max-w-md"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-cs-text mb-1.5 block">
                  Work experience
                </label>
                <textarea
                  value={workExperience}
                  onChange={(e) =>
                    setWorkExperience(e.target.value.slice(0, MAX_WORK_EXP_LEN))
                  }
                  maxLength={MAX_WORK_EXP_LEN}
                  rows={4}
                  className={cn(
                    "placeholder:text-muted-foreground max-w-md min-h-[100px] w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-y md:text-sm",
                    "focus-visible:border-cs-primary focus-visible:ring-ring/50 focus-visible:ring-[1px]",
                  )}
                />
                <p className="text-xs text-cs-text mt-1">
                  {workExperience.length} / {MAX_WORK_EXP_LEN}
                </p>
              </div>
              <div className="grid max-w-md gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-cs-text mb-1.5 block">
                    Age
                    <RequiredFieldMark />
                  </label>
                  <Input
                    type="number"
                    min={13}
                    max={120}
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-cs-text mb-1.5 block">
                    Gender
                    <RequiredFieldMark />
                  </label>
                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as ParticipantGenderValue | "")
                    }
                    className={cn(
                      "border-cs-border h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
                      "focus-visible:border-cs-primary focus-visible:ring-ring/50 focus-visible:ring-[1px]",
                    )}
                  >
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={!isProfileDirty || profileMutation.isPending}
          >
            {profileMutation.isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>

      <ConfirmDialog
        open={profileSaveDialogOpen}
        onOpenChange={setProfileSaveDialogOpen}
        title="Save profile changes?"
        description={
          user?.role === ROLES.PARTICIPANT
            ? "Your updates to profile, bio, and participant details will be saved."
            : "Your updates to name, username, and bio will be saved to your account."
        }
        confirmLabel="Save"
        cancelLabel="Cancel"
        onConfirm={executeProfileSave}
        loading={profileMutation.isPending}
      />

      {/* Email change with OTP */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Email</h2>
        <p className="p1 text-cs-text mb-4">
          Current email: <strong>{user.email}</strong>
        </p>
        {emailStep === "form" ? (
          <form onSubmit={onRequestEmailChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">
                New email
              </label>
              <Input
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="max-w-md"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={emailChangeDisabled || requestEmailMutation.isPending}
            >
              {requestEmailMutation.isPending
                ? "Sending code…"
                : "Send verification code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirmEmailChange} className="space-y-4">
            <p className="text-sm text-cs-text">
              Enter the 6-digit code sent to <strong>{newEmail}</strong>
            </p>
            <div
              className="flex gap-2 justify-start"
              onPaste={handleEmailOtpPaste}
            >
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    emailOtpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={emailOtpDigits[i]}
                  onChange={(e) => setEmailOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !emailOtpDigits[i] && i > 0)
                      emailOtpRefs.current[i - 1]?.focus();
                  }}
                  className={cn("w-11 h-12 text-center text-xl font-mono p-0")}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={
                  confirmEmailMutation.isPending ||
                  emailOtpDigits.join("").length !== OTP_LENGTH
                }
              >
                {confirmEmailMutation.isPending
                  ? "Updating…"
                  : "Confirm new email"}
              </Button>
              <button
                type="button"
                onClick={() => requestEmailMutation.mutate(newEmail)}
                disabled={
                  requestEmailMutation.isPending || emailResendCooldown > 0
                }
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {emailResendCooldown > 0
                  ? `Resend in ${emailResendCooldown}s`
                  : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailStep("form");
                  setNewEmail("");
                  setEmailOtpDigits(Array(OTP_LENGTH).fill(""));
                }}
                className="text-sm text-cs-text hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Password change with OTP */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Password</h2>
        {passwordStep === "idle" ? (
          <div>
            <p className="p1 text-cs-text mb-4">
              We will send a verification code to your email before changing
              your password.
            </p>
            <Button
              onClick={() => requestPasswordMutation.mutate()}
              disabled={requestPasswordMutation.isPending}
            >
              {requestPasswordMutation.isPending
                ? "Sending…"
                : "Send verification code"}
            </Button>
          </div>
        ) : (
          <form onSubmit={onConfirmPasswordChange} className="space-y-4">
            <p className="text-sm text-cs-text">
              Enter the 6-digit code sent to your email.
            </p>
            <div
              className="flex gap-2 justify-start"
              onPaste={handlePasswordOtpPaste}
            >
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    passwordOtpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={passwordOtpDigits[i]}
                  onChange={(e) => setPasswordOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !passwordOtpDigits[i] && i > 0)
                      passwordOtpRefs.current[i - 1]?.focus();
                  }}
                  className={cn("w-11 h-12 text-center text-xl font-mono p-0")}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">
                New password
              </label>
              <PasswordInput
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError(null);
                }}
                aria-invalid={!!passwordError}
                className={cn(
                  "max-w-md",
                  passwordError && FIELD_ERROR_INPUT_CLASS,
                )}
              />
              {passwordError && (
                <p className="mt-1 text-sm !text-red-500">{passwordError}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">
                Confirm new password
              </label>
              <PasswordInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={
                  confirmPasswordMutation.isPending ||
                  passwordOtpDigits.join("").length !== OTP_LENGTH ||
                  !newPassword ||
                  newPassword !== confirmPassword
                }
              >
                {confirmPasswordMutation.isPending
                  ? "Updating…"
                  : "Change password"}
              </Button>
              <button
                type="button"
                onClick={() => requestPasswordMutation.mutate()}
                disabled={
                  requestPasswordMutation.isPending ||
                  passwordResendCooldown > 0
                }
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {passwordResendCooldown > 0
                  ? `Resend in ${passwordResendCooldown}s`
                  : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordStep("idle");
                  setPasswordOtpDigits(Array(OTP_LENGTH).fill(""));
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-sm text-cs-text hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
