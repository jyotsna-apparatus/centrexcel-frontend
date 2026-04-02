"use client";

import {
  Calendar,
  Eye,
  FileText,
  FileUp,
  Pencil,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HACKATHON_APPROVAL_LABELS,
  HACKATHON_STATUS_LABELS,
} from "@/config/hackathon-constants";
import type { HackathonListItem } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

function isApplyDeadlinePassed(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/** Build URL for hackathon banner image (proxied via /api). */
export function hackathonImageSrc(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath?.trim()) return null;
  const p = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `/api${p}`;
}

export function formatHackathonDeadline(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ApprovalBadge({ status }: { status: string }) {
  if (!status || status === "approved") return null;
  const label = HACKATHON_APPROVAL_LABELS[status] ?? status;
  const className =
    status === "pending_review"
      ? "bg-sky-500/15 text-sky-800 dark:text-sky-300"
      : status === "changes_requested"
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : status === "rejected"
          ? "bg-red-500/15 text-red-800 dark:text-red-300"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = HACKATHON_STATUS_LABELS[status] ?? status;
  const className =
    status === "open"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : status === "submission_closed"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : status === "closed"
          ? "bg-muted text-muted-foreground"
          : "bg-red-500/15 text-red-700 dark:text-red-400";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  );
}

type HackathonCardProps = {
  hackathon: HackathonListItem;
  variant: "featured" | "list";
  isAdmin?: boolean;
  /** When true, show approval workflow badge if not approved */
  showApprovalBadge?: boolean;
  /** Sponsor can edit pending / changes / rejected own challenges */
  isSponsor?: boolean;
  isParticipant?: boolean;
  /** When true, participant has already enrolled in this hackathon. */
  hasParticipated?: boolean;
  /** When set, user is in a team for this hackathon—show "Submit with team" instead of "Solo". */
  userTeamForHackathon?: { id: string } | null;
  className?: string;
  /** Optional AOS attributes (e.g. data-aos, data-aos-delay). */
  dataAos?: string;
  dataAosDelay?: string;
};

export function HackathonCard({
  hackathon,
  variant,
  isAdmin = false,
  showApprovalBadge = false,
  isSponsor = false,
  isParticipant = false,
  hasParticipated = false,
  userTeamForHackathon: _userTeamForHackathon = null,
  className,
  dataAos,
  dataAosDelay,
}: HackathonCardProps) {
  const imageSrc = hackathonImageSrc(hackathon.image);
  const applyClosed = isApplyDeadlinePassed(hackathon.applyDeadline);
  const applyBy = formatHackathonDeadline(hackathon.applyDeadline);
  const submitBy = formatHackathonDeadline(hackathon.finalSubmissionDeadline);

  if (variant === "featured") {
    return (
      <div
        className={cn(
          "card cs-card glass flex flex-col overflow-hidden !p-0 gap-0",
          className,
        )}
        {...(dataAos && { "data-aos": dataAos })}
        {...(dataAosDelay && { "data-aos-delay": dataAosDelay })}
      >
        {imageSrc ? (
          <div
            className="relative w-full overflow-hidden bg-muted"
            style={{ aspectRatio: "5/3" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover"
              style={{ aspectRatio: "5/3" }}
            />
          </div>
        ) : (
          <div
            className="w-full bg-muted"
            style={{ aspectRatio: "5/3" }}
            aria-hidden
          />
        )}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="h4">{hackathon.title}</h3>
          <p className="p1 text-cs-text">
            Apply by {applyBy} · Submit by {submitBy}
          </p>
          {hackathon.isPaid && hackathon.priceOfEntry != null ? (
            <p className="p1">
              Entry:{" "}
              <span className="text-cs-primary">
                ₹{Number(hackathon.priceOfEntry).toLocaleString()}
              </span>
            </p>
          ) : (
            <p className="p1">
              Entry: <span className="text-cs-primary">Free</span>
            </p>
          )}
          <Button variant="outline" size="sm" asChild className="mt-auto w-fit">
            <Link href={`/hackathons/${hackathon.id}`}>View details</Link>
          </Button>
        </div>
      </div>
    );
  }

  // list variant
  return (
    <div
      className={cn(
        "flex w-full min-w-[300px] max-w-[400px] flex-col rounded-lg border border-cs-border bg-card shadow-xs transition-shadow hover:shadow-sm",
        className,
      )}
      {...(dataAos && { "data-aos": dataAos })}
      {...(dataAosDelay && { "data-aos-delay": dataAosDelay })}
    >
      {imageSrc ? (
        <div
          className="relative w-full overflow-hidden rounded-t-lg bg-muted"
          style={{ aspectRatio: "5/3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
            style={{ aspectRatio: "5/3" }}
          />
        </div>
      ) : (
        <div
          className="w-full rounded-t-lg bg-muted"
          style={{ aspectRatio: "5/3" }}
          aria-hidden
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-cs-heading line-clamp-2">
            {hackathon.title}
          </h3>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {showApprovalBadge && hackathon.approvalStatus ? (
              <ApprovalBadge status={hackathon.approvalStatus} />
            ) : null}
            <StatusBadge status={hackathon.status} />
          </div>
        </div>
        <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {hackathon.shortDescription || "—"}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" />
              Apply {applyBy}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              <FileUp className="size-3.5 shrink-0" />
              Submit {submitBy}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" />
            {hackathon._count?.submissions ?? 0} entries
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {hackathon._count?.teams ?? 0} teams
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-cs-border p-4">
        <Button variant="outline" size="sm" className="flex-1 min-w-0" asChild>
          <Link href={`/hackathons/${hackathon.id}`}>
            <Eye className="mr-1.5 size-4 shrink-0" />
            View
          </Link>
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-0"
            asChild
          >
            <Link href={`/hackathons/${hackathon.id}/edit`}>
              <Pencil className="mr-1.5 size-4 shrink-0" />
              Edit
            </Link>
          </Button>
        )}
        {isSponsor && hackathon.sponsorId && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-0"
            asChild
          >
            <Link href={`/hackathons/${hackathon.id}/edit`}>
              <Pencil className="mr-1.5 size-4 shrink-0" />
              Edit
            </Link>
          </Button>
        )}
        {isParticipant &&
          !hasParticipated &&
          !applyClosed &&
          hackathon.approvalStatus === "approved" &&
          hackathon.status !== "submission_closed" &&
          hackathon.status !== "closed" &&
          hackathon.status !== "cancelled" && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 min-w-0"
              asChild
            >
              <Link href={`/hackathons/${hackathon.id}/apply`}>
                <UserPlus className="mr-1.5 size-4 shrink-0" />
                Participate
              </Link>
            </Button>
          )}
        {isParticipant &&
          !hasParticipated &&
          applyClosed &&
          hackathon.approvalStatus === "approved" &&
          hackathon.status !== "closed" &&
          hackathon.status !== "cancelled" && (
            <p className="w-full text-xs text-muted-foreground">
              Applications closed — the apply-by date has passed. Open
              indicates the challenge may still be running for existing
              participants.
            </p>
          )}
      </div>
    </div>
  );
}
