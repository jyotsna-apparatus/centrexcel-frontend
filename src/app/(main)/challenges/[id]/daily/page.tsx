"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { ZipUploader } from "@/components/submissions/zip-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { getChallenge, getMyDailyHistory } from "@/lib/challenges-api";
import {
  completeDailyUpload,
  downloadDailyEntryFile,
  triggerBrowserDownload,
} from "@/lib/submissions-api";
import { cn } from "@/lib/utils";

export default function StartupDailyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: challengeId } = use(params);
  const qc = useQueryClient();
  const [dialogDay, setDialogDay] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["daily-history", challengeId],
    queryFn: () => getMyDailyHistory(challengeId),
  });

  const finalize = useMutation({
    mutationFn: async () => {
      if (dialogDay == null) throw new Error("No day selected");
      if (!uploadSessionId) throw new Error("Upload your zip first");
      const fb = feedback.replace(/<p><\/p>/g, "").trim();
      const textOnly = fb.replace(/<[^>]+>/g, "").trim();
      if (!textOnly) throw new Error("Daily note is required");
      return completeDailyUpload(uploadSessionId, {
        dayNumber: dialogDay,
        feedbackMessage: fb,
      });
    },
    onSuccess: () => {
      toast.success("Daily entry saved");
      qc.invalidateQueries({ queryKey: ["daily-history", challengeId] });
      setDialogDay(null);
      setFeedback("");
      setUploadSessionId(null);
      setUploaderKey((k) => k + 1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-cs-primary" />
      </div>
    );
  }

  const { challenge: ch, entries, currentDay, canSubmit, participation } = data;
  const duration = ch.startupDurationDays ?? 0;
  const days = Array.from({ length: duration }, (_, i) => i + 1);
  const entryByDay = new Map(entries.map((e) => [e.dayNumber, e]));

  if (ch.challengeType !== "startup") {
    return (
      <div className="rounded-lg border border-cs-border p-6 text-sm">
        Daily entries apply only to startup challenges.
        <Button asChild variant="link" className="mt-2 block">
          <Link href={`/challenges/${challengeId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  if (!participation) {
    return (
      <div className="rounded-lg border border-cs-border p-6 text-sm text-muted-foreground">
        Enroll in this challenge to submit daily entries.
        <Button asChild className="mt-4" variant="outline">
          <Link href={`/challenges/${challengeId}/enroll`}>Enroll</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Daily journal"
        description={challenge?.title ?? ch.title}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${challengeId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <p className="mb-6 text-sm text-muted-foreground">
        Today is day <strong>{currentDay}</strong> of {duration}. Submit one zip per day
        before the day ends (UTC calendar).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((day) => {
          const entry = entryByDay.get(day);
          const isToday = day === currentDay;
          const isPast = currentDay > day;
          const isFuture = currentDay < day;
          return (
            <button
              key={day}
              type="button"
              disabled={isFuture || (!!entry && !isToday)}
              onClick={() => {
                if (entry) {
                  void (async () => {
                    try {
                      const { blob, filename } = await downloadDailyEntryFile(entry.id);
                      triggerBrowserDownload(blob, filename);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Download failed");
                    }
                  })();
                  return;
                }
                if (isToday && canSubmit) {
                  setDialogDay(day);
                  setFeedback("");
                  setUploadSessionId(null);
                  setUploaderKey((k) => k + 1);
                }
              }}
              className={cn(
                "flex flex-col rounded-lg border border-cs-border bg-card p-4 text-left transition-colors",
                isToday && canSubmit && !entry && "ring-2 ring-cs-primary/40",
                !entry && isToday && canSubmit && "hover:bg-muted/40",
                entry && "cursor-pointer hover:bg-muted/30",
                isFuture && "cursor-not-allowed opacity-50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-cs-primary/10 text-sm font-semibold text-cs-primary">
                  {day}
                </span>
                {entry ? (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                ) : isToday ? (
                  <Calendar className="size-4 text-muted-foreground" />
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {entry
                  ? "Submitted — click to download"
                  : isFuture
                    ? "Locked"
                    : isPast
                      ? "Missed"
                      : canSubmit
                        ? "Submit today"
                        : "Closed"}
              </p>
            </button>
          );
        })}
      </div>

      <Dialog open={dialogDay != null} onOpenChange={(o) => !o && setDialogDay(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Day {dialogDay} entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <span className="text-sm font-medium">Daily note *</span>
              <TiptapEditor
                value={feedback}
                onChange={setFeedback}
                placeholder="What did you build today?"
                maxLength={5000}
                editorContentClassName="min-h-[120px]"
              />
            </div>
            <div>
              <span className="text-sm font-medium">Zip upload *</span>
              <ZipUploader
                key={uploaderKey}
                challengeId={challengeId}
                mode="daily"
                purpose="daily_entry"
                onChunksComplete={(sid) => setUploadSessionId(sid)}
                resetKey={uploaderKey}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDay(null)}>
              Cancel
            </Button>
            <Button
              disabled={finalize.isPending || !uploadSessionId}
              onClick={() => finalize.mutate()}
            >
              {finalize.isPending ? "Saving…" : "Save entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
