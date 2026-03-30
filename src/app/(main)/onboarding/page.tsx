"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { completeOnboarding } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/webp,image/jpeg,image/jpg";
const MAX_BIO = 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loadUser } = useAuth();
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.isOnboarded === true) {
      router.replace("/dashboard");
    }
  }, [user?.isOnboarded, router]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose a profile picture");
      return completeOnboarding({ profileBio: bio.trim(), profilePic: file });
    },
    onSuccess: async () => {
      await loadUser();
      toast.success("Profile complete. Welcome!");
      router.replace("/dashboard");
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
    <div className="mx-auto max-w-lg space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Complete your profile</h1>
        <p className="p1 mt-1 text-cs-text">
          Add a profile photo and a short bio before you browse hackathons. You
          can change these later in Settings.
        </p>
      </header>

      <section className="rounded-lg border border-cs-border bg-card p-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-cs-text mb-1.5 block">
            Profile picture
          </label>
          <p className="text-xs text-cs-text mb-2">
            PNG, WebP, or JPEG — max 2000×2000px, 2MB
          </p>
          <Input
            type="file"
            accept={ACCEPT}
            className="cursor-pointer"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {preview && (
            <div className="relative mt-4 h-32 w-32 overflow-hidden rounded-full border border-cs-border">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-cs-text mb-1.5 block">
            Bio
          </label>
          <textarea
            placeholder="Tell others about you (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
            maxLength={MAX_BIO}
            rows={5}
            className={cn(
              "placeholder:text-muted-foreground w-full min-h-[120px] rounded-md border border-cs-border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-y md:text-sm",
              "focus-visible:border-cs-primary focus-visible:ring-ring/50 focus-visible:ring-[1px]",
            )}
          />
          <p className="text-xs text-cs-text mt-1">
            {bio.length} / {MAX_BIO}
          </p>
        </div>

        <Button
          type="button"
          disabled={!file || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving…" : "Continue"}
        </Button>
      </section>
    </div>
  );
}
