"use client";

import { use, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { confirmEnrollment } from "@/lib/challenges-api";
import { invalidateParticipationQueries } from "@/lib/participation-query-utils";

type Status = "verifying" | "ok" | "failed";

export default function EnrollReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: challengeId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = useSearchParams();
  const merchantOrderId = search.get("merchantOrderId");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string>(
    "Confirming your payment with PhonePe...",
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!merchantOrderId) {
        setStatus("failed");
        setMessage("Missing merchantOrderId in redirect URL.");
        return;
      }
      try {
        await confirmEnrollment(challengeId, merchantOrderId);
        if (cancelled) return;
        await invalidateParticipationQueries(queryClient, { challengeId });
        setStatus("ok");
        setMessage("Payment confirmed and enrollment finalised.");
      } catch (err) {
        if (cancelled) return;
        await invalidateParticipationQueries(queryClient, { challengeId });
        setStatus("failed");
        setMessage(
          err instanceof Error
            ? err.message
            : "Could not confirm your payment. Contact support if you were charged.",
        );
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [challengeId, merchantOrderId, queryClient]);

  return (
    <div>
      <PageHeader
        title="Enrollment payment"
        description="Verifying your checkout with PhonePe"
      />
      <GlassCard className="space-y-4 p-6">
        {status === "verifying" && (
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-cs-primary" />
            <p className="text-sm">{message}</p>
          </div>
        )}
        {status === "ok" && (
          <>
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-6" />
              <h3 className="text-lg font-semibold">{message}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your team is created and locked at the size you chose. Head to
              the challenge to start submitting.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push(`/challenges/${challengeId}`)}>
                Go to challenge
              </Button>
              <Button variant="outline" asChild>
                <Link href="/participations">My participations</Link>
              </Button>
            </div>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
              <XCircle className="size-6" />
              <h3 className="text-lg font-semibold">Payment not confirmed</h3>
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/challenges/${challengeId}/enroll`)}
              >
                Try again
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/challenges/${challengeId}`}>Back to challenge</Link>
              </Button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
