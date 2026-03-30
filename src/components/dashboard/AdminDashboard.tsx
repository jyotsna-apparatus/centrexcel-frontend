"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Gavel,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { hackathonImageSrc } from "@/components/hackathon-card/HackathonCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getHackathons, getUsers } from "@/lib/auth-api";
import { userListInitials, userTablePrimaryLine } from "@/lib/user-display";

const PROFILE_PLACEHOLDER = "/profile-placeholder.svg";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  trend?: string;
  className?: string;
};

function StatCard({
  title,
  value,
  icon,
  href,
  trend,
  className = "",
}: StatCardProps) {
  const content = (
    <div
      className={`glass cs-card rounded-lg border border-cs-border p-6 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-muted-foreground mt-1 text-xs">{trend}</p>
          )}
        </div>
        <div className="rounded-full bg-primary p-3 text-primary">
          <span className="brightness-0 ">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch statistics
  const { data: participantsData } = useQuery({
    queryKey: ["dashboard", "participants"],
    queryFn: () => getUsers({ page: 1, limit: 1, role: "participant" }),
  });

  const { data: judgesData } = useQuery({
    queryKey: ["dashboard", "judges"],
    queryFn: () => getUsers({ page: 1, limit: 1, role: "judge" }),
  });

  const { data: sponsorsData } = useQuery({
    queryKey: ["dashboard", "sponsors"],
    queryFn: () => getUsers({ page: 1, limit: 1, role: "sponsor" }),
  });

  const { data: hackathonsData } = useQuery({
    queryKey: ["dashboard", "hackathons"],
    queryFn: () => getHackathons({ page: 1, limit: 1 }),
  });

  const totalParticipants = participantsData?.pagination?.total ?? 0;
  const totalJudges = judgesData?.pagination?.total ?? 0;
  const totalSponsors = sponsorsData?.pagination?.total ?? 0;
  const totalHackathons = hackathonsData?.pagination?.total ?? 0;
  const _totalUsers = totalParticipants + totalJudges + totalSponsors;

  // Get recent data for activity
  const { data: recentParticipants } = useQuery({
    queryKey: ["dashboard", "recent-participants"],
    queryFn: () => getUsers({ page: 1, limit: 5, role: "participant" }),
  });

  const recentParticipantsList = recentParticipants?.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Admin Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Here's what's happening with your
          platform.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Challenges"
          value={totalHackathons}
          icon={<Trophy className="size-6" />}
          href="/hackathons"
          trend={
            totalHackathons === 0 ? "Create one to get started" : "View all"
          }
        />
        <StatCard
          title="Total Users"
          value={totalSponsors}
          icon={<UsersRound className="size-6" />}
          href="/users/participants"
          trend={`Active sponsors`}
        />
        <StatCard
          title="Participants"
          value={totalParticipants}
          icon={<UserCheck className="size-6" />}
          href="/users/participants"
          trend="Active users"
        />
        <StatCard
          title="Judges"
          value={totalJudges}
          icon={<Gavel className="size-6" />}
          href="/users/judges"
          trend="Available judges"
        />
      </div>

      {/* Quick Actions */}
      <div className="glass cs-card rounded-lg border border-cs-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/users/participants/add">
              <UserCheck className="mr-2 size-4" />
              Add Participant
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/users/judges/add">
              <Gavel className="mr-2 size-4" />
              Add Judge
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/users/sponsors/add">
              <Building2 className="mr-2 size-4" />
              Add Sponsor
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/hackathons">
              <Trophy className="mr-2 size-4" />
              View Challenges
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Participants */}
        <div className="glass cs-card rounded-lg border border-cs-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Participants</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users/participants">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          {recentParticipantsList.length > 0 ? (
            <div className="space-y-3">
              {recentParticipantsList.map((participant) => (
                <Link
                  key={participant.id}
                  href={`/users/participants/${participant.id}`}
                  className="flex items-center justify-between rounded-md border border-cs-border bg-cs-card/50 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 shrink-0 border border-cs-border">
                      <AvatarImage
                        src={
                          hackathonImageSrc(participant.profilePic ?? null) ??
                          PROFILE_PLACEHOLDER
                        }
                        alt=""
                      />
                      <AvatarFallback className="text-xs">
                        {userListInitials(participant)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {userTablePrimaryLine(participant)}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {participant.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {participant.createdAt
                      ? new Date(participant.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No participants yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
