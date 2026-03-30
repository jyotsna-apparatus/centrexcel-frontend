"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { HACKATHON_APPROVAL_LABELS } from "@/config/hackathon-constants";
import { useAuth } from "@/contexts/auth-context";
import { useHackathons } from "@/hooks/use-hackathons";
import { deleteHackathon, reviewHackathon } from "@/lib/auth-api";

const FILTERS = [
  { value: "pending_review", label: "Pending review" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function HackathonApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("pending_review");
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/hackathons");
    }
  }, [user, router]);

  const { data, isLoading, isError, error } = useHackathons({
    page: 0,
    pageSize: 50,
    approvalStatus: filter,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["hackathons"] });
  };

  const mutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      action: "approve" | "reject" | "request_changes";
      feedback?: string;
    }) =>
      reviewHackathon(payload.id, {
        action: payload.action,
        feedback: payload.feedback,
      }),
    onSuccess: () => {
      toast.success("Review saved.");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save review");
    },
  });

  const hackathons = data?.data ?? [];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Challenge approvals"
        description="Review sponsor-submitted challenges: approve, request changes, or reject."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/hackathons">
            <ArrowLeft className="mr-2 size-4" />
            Back to hackathons
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label
          className="text-sm text-muted-foreground"
          htmlFor="approval-filter"
        >
          Filter
        </label>
        <Select
          id="approval-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-[220px]"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {isError && (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading…
        </div>
      ) : hackathons.length === 0 ? (
        <p className="text-muted-foreground">No hackathons in this queue.</p>
      ) : (
        <ul className="space-y-6">
          {hackathons.map((h) => {
            const fb = feedbackById[h.id] ?? "";
            return (
              <li
                key={h.id}
                className="rounded-lg border border-cs-border bg-card p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-cs-heading">{h.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {h.shortDescription}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sponsor:{" "}
                      {h.sponsor?.username ?? h.sponsor?.email ?? h.sponsorId}
                    </p>
                    {h.adminFeedback ? (
                      <p className="mt-2 rounded-md bg-muted/60 p-2 text-sm whitespace-pre-wrap">
                        <span className="font-medium">Last note: </span>
                        {h.adminFeedback}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/hackathons/${h.id}`}>Open</Link>
                  </Button>
                </div>
                <label
                  className="mt-4 block text-sm font-medium"
                  htmlFor={`fb-${h.id}`}
                >
                  Feedback (optional for approve; required for reject or request
                  changes)
                </label>
                <textarea
                  id={`fb-${h.id}`}
                  value={fb}
                  onChange={(e) =>
                    setFeedbackById((prev) => ({
                      ...prev,
                      [h.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="border-cs-border placeholder:text-muted-foreground mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
                  placeholder="Notes for the sponsor…"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        id: h.id,
                        action: "approve",
                        feedback: fb || undefined,
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={mutation.isPending}
                    onClick={() => {
                      const t = fb.trim();
                      if (!t) {
                        toast.error("Add feedback when requesting changes.");
                        return;
                      }
                      mutation.mutate({
                        id: h.id,
                        action: "request_changes",
                        feedback: t,
                      });
                    }}
                  >
                    Request changes
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={mutation.isPending}
                    onClick={() => {
                      const t = fb.trim();
                      if (!t) {
                        toast.error("Add feedback when rejecting.");
                        return;
                      }
                      mutation.mutate({
                        id: h.id,
                        action: "reject",
                        feedback: t,
                      });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Delete this challenge permanently? This cannot be undone.",
                        )
                      ) {
                        return;
                      }
                      try {
                        await deleteHackathon(h.id);
                        toast.success("Challenge deleted.");
                        invalidate();
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Delete failed",
                        );
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Status:{" "}
                  {HACKATHON_APPROVAL_LABELS[h.approvalStatus ?? ""] ??
                    h.approvalStatus}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
