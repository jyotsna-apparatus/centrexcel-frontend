"use client";

import { SafeHtmlContent } from "@/components/safe-html-content";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import type { UserListItem } from "@/lib/auth-api";

function field(
  id: string,
  label: string,
  value: string,
) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-muted-foreground mb-1 block text-sm font-medium"
      >
        {label}
      </label>
      <Input id={id} value={value} readOnly disabled className="bg-muted/50" />
    </div>
  );
}

export function AdminUserProfileFields({ user }: { user: UserListItem }) {
  const pic = user.profilePic?.trim();
  return (
    <div className="space-y-6">
      {pic ? (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pic}
            alt=""
            className="size-28 rounded-full border border-cs-border object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto grid max-w-lg gap-4">
        {field("u-name", "Name", user.name ?? "—")}
        {field("u-username", "Username", user.username ?? "—")}
        {field("u-email", "Email", user.email)}
        {field("u-phone", "Phone", user.phone ?? "—")}
        {field("u-role", "Role", user.role)}
        {field("u-verified", "Email verified", user.emailVerified ? "Yes" : "No")}
        {field(
          "u-onboarded",
          "Onboarding complete",
          user.isOnboarded === true
            ? "Yes"
            : user.isOnboarded === false
              ? "No"
              : "—",
        )}
        {field("u-education", "Education", user.education ?? "—")}
        {field("u-profession", "Profession", user.profession ?? "—")}
        {field("u-age", "Age", user.age != null ? String(user.age) : "—")}
        {field("u-gender", "Gender", user.gender ?? "—")}
        <div>
          <span className="text-muted-foreground mb-1 block text-sm font-medium">
            Work experience
          </span>
          <textarea
            readOnly
            disabled
            className="border-cs-border bg-muted/50 min-h-[72px] w-full rounded-md border px-3 py-2 text-sm"
            value={user.workExperience ?? ""}
          />
        </div>
        {user.profileBio ? (
          <div>
            <span className="text-muted-foreground mb-1 block text-sm font-medium">
              Profile bio
            </span>
            <SafeHtmlContent html={user.profileBio} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminUserActivityCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-3 font-semibold text-cs-heading">{title}</h3>
      {children}
    </GlassCard>
  );
}
