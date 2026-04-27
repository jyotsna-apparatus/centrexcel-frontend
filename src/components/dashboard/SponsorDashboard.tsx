"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileUp, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { HackathonCard } from "@/components/hackathon-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { listChallenges } from "@/lib/challenges-api";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  className?: string;
};

function StatCard({ title, value, icon, href, className = "" }: StatCardProps) {
  const content = (
    <div className={`app-glass-surface rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
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

export default function SponsorDashboard() {
  const { user } = useAuth();

  const { data: challengesData } = useQuery({
    queryKey: ["dashboard", "sponsor-challenges", user?.id],
    queryFn: () => listChallenges({ page: 1, limit: 20, mine: true }),
    enabled: !!user?.id,
  });

  const myChallenges = challengesData?.data ?? [];
  const activeChallenges = myChallenges.filter(
    (h) => h.status !== "closed" && h.status !== "cancelled",
  );
  const totalEnrollments = myChallenges.reduce(
    (sum, h) => sum + (h._count?.participations ?? 0),
    0,
  );
  const totalTeams = myChallenges.reduce(
    (sum, h) => sum + (h._count?.teams ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Sponsor Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Manage your challenges and shortlists.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="My challenges"
          value={myChallenges.length}
          icon={<Trophy className="size-6" />}
          href="/challenges"
        />
        <StatCard
          title="Active"
          value={activeChallenges.length}
          icon={<Trophy className="size-6" />}
          href="/challenges"
        />
        <StatCard
          title="Enrollments"
          value={totalEnrollments}
          icon={<FileUp className="size-6" />}
        />
        <StatCard
          title="Teams"
          value={totalTeams}
          icon={<Users className="size-6" />}
        />
      </div>

      <div className="app-glass-surface rounded-lg p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/challenges">
              <Trophy className="mr-2 size-4" />
              My challenges
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/challenges/new">
              <Trophy className="mr-2 size-4" />
              New challenge
            </Link>
          </Button>
        </div>
      </div>

      <div className="app-glass-surface rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My challenges</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/challenges">
              View all
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        {myChallenges.length > 0 ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 400px))",
            }}
          >
            {myChallenges.slice(0, 6).map((c) => (
              <HackathonCard
                key={c.id}
                hackathon={c}
                variant="list"
                isAdmin={false}
                showApprovalBadge
                isSponsor
                isParticipant={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No challenges yet
          </p>
        )}
      </div>
    </div>
  );
}
