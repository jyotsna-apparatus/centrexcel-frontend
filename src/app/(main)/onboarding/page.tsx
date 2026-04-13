"use client";

import { useMutation } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequiredFieldMark } from "@/components/required-field-mark";
import { UploadRequirementHint } from "@/components/upload-requirement-hint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import {
  completeOnboarding,
  type ParticipantGenderValue,
} from "@/lib/auth-api";
import { getPostAuthHomePath } from "@/lib/post-auth-home";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/webp,image/jpeg,image/jpg";
const MAX_BIO = 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_WORK_EXP = 2000;
const GENDER_OPTIONS: { value: ParticipantGenderValue; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loadUser } = useAuth();
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [education, setEducation] = useState("");
  const [profession, setProfession] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [gender, setGender] = useState<ParticipantGenderValue | "">("");
  const [profilePicInputKey, setProfilePicInputKey] = useState(0);

  useEffect(() => {
    if (user?.isOnboarded === true) {
      router.replace(getPostAuthHomePath(user));
    }
  }, [user, router]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isParticipant = user?.role === "participant";

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose a profile picture");
      if (isParticipant) {
        const ed = education.trim();
        const pr = profession.trim();
        const wx = workExperience.trim();
        if (!ed) throw new Error("Education is required");
        if (ed.length > 200) throw new Error("Education must be at most 200 characters");
        if (!pr) throw new Error("Profession is required");
        if (pr.length > 200) throw new Error("Profession must be at most 200 characters");
        if (!wx) throw new Error("Work experience is required");
        if (wx.length > MAX_WORK_EXP) {
          throw new Error(
            `Work experience must be at most ${MAX_WORK_EXP} characters`,
          );
        }
        const ageNum = parseInt(ageInput.trim(), 10);
        if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120) {
          throw new Error("Enter a valid age between 13 and 120");
        }
        if (!gender) throw new Error("Select a gender option");
        return completeOnboarding({
          profileBio: bio.trim(),
          profilePic: file,
          participant: {
            education: ed,
            profession: pr,
            workExperience: wx,
            age: ageNum,
            gender,
          },
        });
      }
      return completeOnboarding({ profileBio: bio.trim(), profilePic: file });
    },
    onSuccess: async () => {
      const next = await loadUser();
      toast.success("Profile complete. Welcome!");
      if (next) {
        router.replace(getPostAuthHomePath(next));
      } else {
        router.replace("/dashboard");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onPickFile = (f: File | null) => {
    setFile(null);
    if (!f) return;
    if (!ACCEPT.split(",").some((t) => f.type === t.trim())) {
      toast.error("Use PNG, WebP, or JPEG only");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
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
      setFile(f);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Could not read that image");
    };
    img.src = objectUrl;
  };

  if (!user || user.isOnboarded === true) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="p1 text-cs-text">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-10 text-center sm:text-left">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cs-border bg-muted/50 px-3 py-1 text-xs font-medium text-cs-text">
          <UserRound className="size-3.5 text-cs-primary" aria-hidden />
          One-time setup
        </div>
        <h1 className="h2 text-cs-heading tracking-tight">
          Complete your profile
        </h1>
        <p className="p1 mx-auto mt-3 max-w-prose text-cs-text sm:mx-0">
          Add a photo and tell us a bit about yourself before you join
          challenges.           Fields marked with <RequiredFieldMark /> are required.
          You can change everything later in Settings.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-cs-border bg-card shadow-sm">
        <div className="border-b border-cs-border bg-muted/30 px-6 py-4">
          <h2 className="text-base font-semibold text-cs-heading">
            Profile & visibility
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your photo appears next to your name across the platform.
          </p>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 justify-center sm:block">
              {preview ? (
                <div className="relative size-36 overflow-hidden rounded-2xl border-2 border-cs-border shadow-sm ring-2 ring-cs-primary/15">
                  <Image
                    src={preview}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cs-border bg-muted/40 text-center">
                  <UserRound
                    className="mb-2 size-10 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="px-3 text-xs text-muted-foreground">
                    Preview appears after you choose a photo
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <label
                htmlFor="onboarding-profile-pic"
                className="text-sm font-medium text-cs-heading"
              >
                Profile picture
                <RequiredFieldMark />
              </label>
              <UploadRequirementHint variant="profile" />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Input
                  key={profilePicInputKey}
                  id="onboarding-profile-pic"
                  type="file"
                  accept={ACCEPT}
                  className="cursor-pointer sm:max-w-xs sm:flex-1"
                  disabled={mutation.isPending}
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={mutation.isPending}
                    onClick={() => {
                      setFile(null);
                      setProfilePicInputKey((k) => k + 1);
                    }}
                  >
                    Clear photo
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-cs-border pt-8">
            <label
              htmlFor="onboarding-bio"
              className="text-sm font-medium text-cs-heading"
            >
              Bio
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional — share skills, interests, or what you hope to build.
            </p>
            <textarea
              id="onboarding-bio"
              placeholder="Tell others about you…"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              maxLength={MAX_BIO}
              rows={5}
              disabled={mutation.isPending}
              className={cn(
                "placeholder:text-muted-foreground mt-3 w-full min-h-[120px] rounded-lg border border-cs-border bg-background px-3 py-2.5 text-base shadow-xs outline-none transition-colors resize-y md:text-sm",
                "focus-visible:border-cs-primary focus-visible:ring-2 focus-visible:ring-cs-primary/20",
              )}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {bio.length} / {MAX_BIO}
            </p>
          </div>

          {isParticipant ? (
            <div className="border-t border-cs-border pt-8">
              <div className="mb-6 rounded-lg bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-cs-heading">
                  Participant details
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  We use this to understand our community and improve matching with
                  challenges.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-cs-heading">
                    Education
                    <RequiredFieldMark />
                  </label>
                  <Input
                    className="mt-2"
                    value={education}
                    onChange={(e) =>
                      setEducation(e.target.value.slice(0, 200))
                    }
                    placeholder="e.g. B.Tech Computer Science"
                    maxLength={200}
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-cs-heading">
                    Profession
                    <RequiredFieldMark />
                  </label>
                  <Input
                    className="mt-2"
                    value={profession}
                    onChange={(e) =>
                      setProfession(e.target.value.slice(0, 200))
                    }
                    placeholder="e.g. Software engineer"
                    maxLength={200}
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-cs-heading">
                    Work experience
                    <RequiredFieldMark />
                  </label>
                  <textarea
                    value={workExperience}
                    onChange={(e) =>
                      setWorkExperience(e.target.value.slice(0, MAX_WORK_EXP))
                    }
                    maxLength={MAX_WORK_EXP}
                    rows={4}
                    placeholder="Brief summary of your professional experience"
                    disabled={mutation.isPending}
                    className={cn(
                      "placeholder:text-muted-foreground mt-2 w-full min-h-[100px] rounded-lg border border-cs-border bg-background px-3 py-2.5 text-base shadow-xs outline-none resize-y md:text-sm",
                      "focus-visible:border-cs-primary focus-visible:ring-2 focus-visible:ring-cs-primary/20",
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {workExperience.length} / {MAX_WORK_EXP}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-cs-heading">
                    Age
                    <RequiredFieldMark />
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min={13}
                    max={120}
                    inputMode="numeric"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    placeholder="e.g. 24"
                    disabled={mutation.isPending}
                  />
                </div>
                <div>
                  <label
                    htmlFor="onboarding-gender"
                    className="text-sm font-medium text-cs-heading"
                  >
                    Gender
                    <RequiredFieldMark />
                  </label>
                  <select
                    id="onboarding-gender"
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as ParticipantGenderValue | "")
                    }
                    disabled={mutation.isPending}
                    className={cn(
                      "border-cs-border mt-2 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs outline-none",
                      "focus-visible:border-cs-primary focus-visible:ring-2 focus-visible:ring-cs-primary/20",
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

          <div className="border-t border-cs-border pt-6">
            <Button
              type="button"
              size="lg"
              className="w-full min-h-11 sm:w-auto sm:min-w-[200px]"
              disabled={!file || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
