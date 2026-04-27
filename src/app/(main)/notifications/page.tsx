"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { NOTIFICATION_TYPE_LABELS } from "@/config/challenge-constants";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/challenges-api";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/challenge";

function notificationHref(n: Notification): string | null {
  if (n.link) return n.link;
  const meta = n.metadata as { challengeId?: unknown } | null;
  if (meta && typeof meta.challengeId === "string") {
    return `/challenges/${meta.challengeId}`;
  }
  return null;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const queryKey = useMemo(
    () => ["notifications", "list", { page, limit: 20 }] as const,
    [page],
  );

  const list = useQuery({
    queryKey,
    queryFn: () => listNotifications({ page, limit: 20 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Every important update about your challenges."
      >
        <Button
          variant="outline"
          disabled={markAll.isPending || items.every((n) => n.isRead)}
          onClick={() => markAll.mutate()}
        >
          {markAll.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckCheck className="mr-2 size-4" />
          )}
          Mark all read
        </Button>
      </PageHeader>

      {list.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-cs-primary" />
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 p-10 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <h3 className="text-base font-medium">No notifications yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            You&apos;ll see updates here when stages are shortlisted, payments
            succeed, winners are announced, and more.
          </p>
        </GlassCard>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const href = notificationHref(n);
            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-cs-border/50 bg-card px-4 py-3 transition hover:border-cs-primary/40",
                  !n.isRead && "bg-cs-primary/5",
                )}
              >
                {!n.isRead ? (
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-cs-primary" />
                ) : (
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-transparent" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type} ·{" "}
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {href ? (
                  <Link
                    href={href}
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => !n.isRead && markRead.mutate(n.id)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
