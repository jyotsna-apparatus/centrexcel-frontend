'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getTeams, getSubmissions } from '@/lib/auth-api'
import {
  Users,
  FileUp,
  Trophy,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

type StatCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
  href?: string
  className?: string
}

function StatCard({ title, value, icon, href, className = '' }: StatCardProps) {
  const content = (
    <div className={`glass cs-card rounded-lg border border-cs-border p-6 shadow-sm transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          {icon}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export default function ParticipantDashboard() {
  const { user } = useAuth()

  // Fetch user's teams
  const { data: teamsData } = useQuery({
    queryKey: ['dashboard', 'participant-teams'],
    queryFn: () => getTeams({ page: 1, limit: 10 }),
  })

  // Fetch user's submissions
  const { data: submissionsData } = useQuery({
    queryKey: ['dashboard', 'participant-submissions'],
    queryFn: () => getSubmissions({ page: 1, limit: 5 }),
  })

  const myTeams = teamsData?.data?.filter((team) =>
    team.members?.some((member) => member.userId === user?.id)
  ) ?? []
  const mySubmissions = submissionsData?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Participant Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Here's your activity overview.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="My Teams"
          value={myTeams.length}
          icon={<Users className="size-6" />}
          href="/users/teams"
        />
        <StatCard
          title="My Submissions"
          value={mySubmissions.length}
          icon={<FileUp className="size-6" />}
          href="/submissions"
        />
      </div>

      {/* Quick Actions */}
      <div className="glass cs-card rounded-lg border border-cs-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/hackathons">
              <Trophy className="mr-2 size-4" />
              Browse Hackathons
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/users/teams">
              <Users className="mr-2 size-4" />
              My Teams
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/submissions">
              <FileUp className="mr-2 size-4" />
              My Submissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Teams */}
        <div className="glass cs-card rounded-lg border border-cs-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Teams</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users/teams">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          {myTeams.length > 0 ? (
            <div className="space-y-3">
              {myTeams.slice(0, 5).map((team) => (
                <Link
                  key={team.id}
                  href={`/users/teams/${team.id}`}
                  className="flex items-center justify-between rounded-md border border-cs-border bg-cs-card/50 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {team.participations?.length
                          ? `${team.participations.length} hackathon(s)`
                          : 'Not in any hackathon yet'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">
                      {team.members?.length ?? 0} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-center py-4 text-sm">No teams yet</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/hackathons">
                  <Plus className="mr-2 size-4" />
                  Join a Hackathon
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* My Submissions */}
        <div className="glass cs-card rounded-lg border border-cs-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Submissions</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/submissions">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          {mySubmissions.length > 0 ? (
            <div className="space-y-3">
              {mySubmissions.slice(0, 5).map((submission) => (
                <Link
                  key={submission.id}
                  href={`/submissions/${submission.id}`}
                  className="flex items-center justify-between rounded-md border border-cs-border bg-cs-card/50 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileUp className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {submission.hackathon?.title ?? 'Unknown hackathon'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {submission.averageScore !== null && (
                      <p className="text-muted-foreground text-xs">
                        Score: {submission.averageScore}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {submission.createdAt
                        ? new Date(submission.createdAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground text-center py-4 text-sm">No submissions yet</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/hackathons">
                  <Plus className="mr-2 size-4" />
                  Create Submission
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
