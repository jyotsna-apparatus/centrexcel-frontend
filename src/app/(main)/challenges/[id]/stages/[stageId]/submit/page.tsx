"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { ZipUploader } from "@/components/submissions/zip-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  getChallenge,
  getMyStageEligibility,
} from "@/lib/challenges-api";
import { completeStageUpload } from "@/lib/submissions-api";
import { STAGE_TYPE_LABELS } from "@/config/challenge-constants";

export default function StageSubmitPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id: challengeId, stageId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });

  const { data: eligibility, isLoading } = useQuery({
    queryKey: ["stage-eligibility", challengeId, stageId],
    queryFn: () => getMyStageEligibility(challengeId, stageId),
  });

  const finalize = useMutation({
    mutationFn: async () => {
      if (!uploadSessionId) throw new Error("Upload your zip file first");
      const t = title.trim();
      if (!t) throw new Error("Title is required");
      return completeStageUpload(uploadSessionId, {
        title: t,
        description: description.trim() || "",
      });
    },
    onSuccess: () => {
      toast.success("Submission received");
      qc.invalidateQueries({ queryKey: ["stage-eligibility", challengeId, stageId] });
      qc.invalidateQueries({ queryKey: ["challenge", challengeId] });
      qc.invalidateQueries({ queryKey: ["participations"] });
      router.push(`/challenges/${challengeId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !eligibility) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      </div>
    );
  }

  const { canSubmit, alreadySubmitted, wasShortlisted, stage } = eligibility;
  const lockedReason = alreadySubmitted
    ? "You already submitted for this stage."
    : !canSubmit
      ? wasShortlisted === false && stage.stageOrder > 1
        ? "You are not eligible for this stage yet."
        : "Submissions are closed for this stage."
      : null;

  return (
    <div>
      <PageHeader
        title={`Submit — ${STAGE_TYPE_LABELS[stage.stageType]}`}
        description={challenge?.title ?? "Challenge"}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challengeId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {lockedReason ? (
        <div className="rounded-lg border border-cs-border bg-card p-6 text-sm text-muted-foreground">
          {lockedReason}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <label htmlFor="sub-title" className="text-sm font-medium text-cs-heading">
              Submission title *
            </label>
            <Input
              id="sub-title"
              className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Project Phoenix"
            />
          </div>
          <div>
            <span className="text-sm font-medium text-cs-heading">Description</span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Optional context for judges (rich text).
            </p>
            <div className="mt-2">
              <TiptapEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your submission…"
                maxLength={5000}
                editorContentClassName="min-h-[140px]"
              />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-cs-heading">Upload (.zip) *</span>
            <ZipUploader
              key={uploaderKey}
              challengeId={challengeId}
              mode="stage"
              stageId={stageId}
              purpose="stage_submission"
              onChunksComplete={(sid) => setUploadSessionId(sid)}
              resetKey={uploaderKey}
            />
            {uploadSessionId ? (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                File ready — click Submit below.
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={finalize.isPending || !uploadSessionId}
              onClick={() => finalize.mutate()}
            >
              {finalize.isPending ? "Submitting…" : "Submit to stage"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadSessionId(null);
                setUploaderKey((k) => k + 1);
              }}
            >
              Re-upload file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
