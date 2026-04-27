"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NOTIFICATION_TYPE_LABELS } from "@/config/challenge-constants";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/challenges-api";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/challenge";

const QK_COUNT = ["notifications", "unread-count"] as const;
const QK_LIST = ["notifications", "list", { limit: 10 }] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function notificationHref(n: Notification): string | null {
  if (n.link) return n.link;
  const meta = n.metadata as { challengeId?: unknown } | null;
  if (meta && typeof meta.challengeId === "string") {
    return `/challenges/${meta.challengeId}`;
  }
  return null;
}

export function NotificationsBell() {
  const qc = useQueryClient();

  const countQuery = useQuery({
    queryKey: QK_COUNT,
    queryFn: getUnreadNotificationCount,
    refetchInterval: 45_000,
  });

  const listQuery = useQuery({
    queryKey: QK_LIST,
    queryFn: () => listNotifications({ page: 1, limit: 10 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_COUNT });
      qc.invalidateQueries({ queryKey: QK_LIST });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_COUNT });
      qc.invalidateQueries({ queryKey: QK_LIST });
    },
  });

  const unread = countQuery.data ?? 0;
  const items = listQuery.data?.data ?? [];

  const onItemClick = useCallback(
    (n: Notification) => {
      if (!n.isRead) markRead.mutate(n.id);
    },
    [markRead],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-10"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-cs-primary px-1 text-[10px] font-semibold text-cs-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {markAll.isPending ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 size-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-[min(70vh,520px)] overflow-y-auto">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-cs-border/40">
              {items.map((n) => {
                const href = notificationHref(n);
                const Row = (
                  <div
                    className={cn(
                      "flex gap-3 px-3 py-3 transition hover:bg-muted/60",
                      !n.isRead && "bg-cs-primary/5",
                    )}
                  >
                    {!n.isRead && (
                      <span
                        aria-hidden
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-cs-primary"
                      />
                    )}
                    <div className={cn("min-w-0 flex-1", n.isRead && "ml-5")}>
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type} ·{" "}
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => onItemClick(n)}
                        className="block focus:bg-muted/60 focus:outline-none"
                      >
                        {Row}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onItemClick(n)}
                        className="block w-full text-left"
                      >
                        {Row}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <Button asChild variant="ghost" className="w-full justify-center">
            <Link href="/notifications">See all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
