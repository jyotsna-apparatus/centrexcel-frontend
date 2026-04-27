"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { STAGE_TYPE_LABELS } from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import {
  getChallenge,
  getChallengeStage,
  updateStage,
} from "@/lib/challenges-api";

function toInputDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

export default function EditStagePage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id: challengeId, stageId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [instructions, setInstructions] = useState("");
  const [applyDeadline, setApplyDeadline] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [reviewDeadline, setReviewDeadline] = useState("");

  const { data: challenge, isLoading: cLoad } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });

  const { data: stage, isLoading: sLoad } = useQuery({
    queryKey: ["stage", challengeId, stageId],
    queryFn: () => getChallengeStage(challengeId, stageId),
  });

  useEffect(() => {
    if (!stage) return;
    setInstructions(stage.instructions ?? "");
    setApplyDeadline(toInputDate(stage.applyDeadline));
    setSubmissionDeadline(toInputDate(stage.submissionDeadline));
    setReviewDeadline(toInputDate(stage.reviewDeadline));
  }, [stage]);

  const canManage =
    user?.role === "admin" ||
    (user?.role === "sponsor" && challenge && user.id === challenge.sponsorId);

  useEffect(() => {
    if (!user || cLoad || !challenge) return;
    if (!canManage) router.replace("/dashboard");
  }, [user, cLoad, challenge, canManage, router]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateStage(challengeId, stageId, {
        instructions,
        applyDeadline: new Date(applyDeadline).toISOString(),
        submissionDeadline: new Date(submissionDeadline).toISOString(),
        reviewDeadline: new Date(reviewDeadline).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Stage updated");
      qc.invalidateQueries({ queryKey: ["stage", challengeId, stageId] });
      qc.invalidateQueries({ queryKey: ["challenge", challengeId] });
      router.push(`/challenges/${challengeId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = cLoad || sLoad;

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit stage" description="Loading…" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!challenge || !stage) {
    return (
      <div>
        <PageHeader title="Edit stage" description="Not found." />
        <Button variant="outline" asChild>
          <Link href={`/challenges/${challengeId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit — ${STAGE_TYPE_LABELS[stage.stageType]}`}
        description={challenge.title}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challengeId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <GlassCard className="space-y-4 p-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium">Instructions</span>
          <TiptapEditor
            value={instructions}
            onChange={setInstructions}
            placeholder="Stage instructions (HTML)"
            maxLength={20000}
            editorContentClassName="min-h-[160px]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="apply">
              Apply deadline
            </label>
            <Input
              id="apply"
              type="datetime-local"
              value={applyDeadline}
              onChange={(e) => setApplyDeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="sub">
              Submission deadline
            </label>
            <Input
              id="sub"
              type="datetime-local"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="rev">
              Review deadline
            </label>
            <Input
              id="rev"
              type="datetime-local"
              value={reviewDeadline}
              onChange={(e) => setReviewDeadline(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </GlassCard>
    </div>
  );
}
