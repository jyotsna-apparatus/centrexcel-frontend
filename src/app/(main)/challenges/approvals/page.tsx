"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  Loader2,
  MessageSquareWarning,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  CHALLENGE_APPROVAL_LABELS,
  CHALLENGE_TYPE_LABELS,
} from "@/config/challenge-constants";
import { useAuth } from "@/contexts/auth-context";
import { listChallenges, reviewChallenge, type ReviewAction } from "@/lib/challenges-api";
import type { Challenge } from "@/types/challenge";

export default function ChallengeApprovalsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [dialog, setDialog] = useState<{
    challenge: Challenge;
    action: ReviewAction;
  } | null>(null);
  const [feedbackHtml, setFeedbackHtml] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () =>
      listChallenges({
        page: 1,
        limit: 50,
        approvalStatus: "pending_review",
      }),
    enabled: user?.role === "admin",
  });

  const rows = data?.data ?? [];

  const reviewMutation = useMutation({
    mutationFn: (input: {
      id: string;
      action: ReviewAction;
      feedback?: string;
    }) => reviewChallenge(input.id, input.action, input.feedback),
    onSuccess: () => {
      toast.success("Challenge updated");
      qc.invalidateQueries({ queryKey: ["approvals", "pending"] });
      qc.invalidateQueries({ queryKey: ["challenges-page"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "pending-approvals"] });
      setDialog(null);
      setFeedbackHtml("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : "Failed to load");
    }
  }, [isError, error]);

  if (user && user.role !== "admin") return null;

  const openDialog = (challenge: Challenge, action: ReviewAction) => {
    setDialog({ challenge, action });
    setFeedbackHtml("");
  };

  const submitReview = () => {
    if (!dialog) return;
    const needsFeedback =
      dialog.action === "reject" || dialog.action === "request_changes";
    if (needsFeedback && !feedbackHtml.trim()) {
      toast.error("Please add feedback for the sponsor.");
      return;
    }
    reviewMutation.mutate({
      id: dialog.challenge.id,
      action: dialog.action,
      feedback: needsFeedback ? feedbackHtml.trim() : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review sponsor-submitted challenges before they go live."
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : rows.length === 0 ? (
        <GlassCard className="px-6 py-14 text-center">
          <ClipboardCheck className="mx-auto mb-3 size-10 text-cs-primary" />
          <p className="font-medium text-cs-heading">Nothing pending</p>
          <p className="mt-1 text-sm text-muted-foreground">
            All caught up — new submissions will appear here.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/challenges">Browse challenges</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {rows.map((c: Challenge) => (
            <GlassCard
              key={c.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold text-cs-heading">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.shortDescription}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {CHALLENGE_TYPE_LABELS[c.challengeType]}
                  </span>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-900 dark:text-amber-200">
                    {CHALLENGE_APPROVAL_LABELS[c.approvalStatus]}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="default" onClick={() => openDialog(c, "approve")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDialog(c, "request_changes")}
                >
                  <MessageSquareWarning className="mr-1 size-4" />
                  Request changes
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDialog(c, "reject")}
                >
                  Reject
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/challenges/${c.id}`}>
                    View <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === "approve"
                ? "Approve challenge"
                : dialog?.action === "reject"
                  ? "Reject challenge"
                  : "Request changes"}
            </DialogTitle>
          </DialogHeader>
          {dialog ? (
            <div className="space-y-3 px-1">
              <p className="text-sm text-muted-foreground">{dialog.challenge.title}</p>
              {dialog.action !== "approve" ? (
                <div>
                  <span className="mb-1.5 block text-sm font-medium">
                    Feedback to sponsor
                  </span>
                  <TiptapEditor
                    value={feedbackHtml}
                    onChange={setFeedbackHtml}
                    placeholder="Explain what needs to change or why this can’t be approved."
                    maxLength={8000}
                    editorContentClassName="min-h-[120px]"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This challenge will be marked approved and visible to participants
                  (subject to challenge status).
                </p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              variant={dialog?.action === "reject" ? "destructive" : "default"}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
