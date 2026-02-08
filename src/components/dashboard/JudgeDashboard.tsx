'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getHackathons } from '@/lib/auth-api'
import {
  Trophy,
  FileUp,
  Gavel,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
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
    <div className={`rounded-lg border border-cs-border bg-cs-card p-6 shadow-sm transition-all hover:shadow-md ${className}`}>
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

export default function JudgeDashboard() {
  const { user } = useAuth()

  // Fetch hackathons (judges see hackathons they're assigned to)
  const { data: hackathonsData } = useQuery({
    queryKey: ['dashboard', 'judge-hackathons'],
    queryFn: () => getHackathons({ page: 1, limit: 10 }),
  })

  const hackathons = hackathonsData?.data ?? []
  const openHackathons = hackathons.filter((h) => h.status === 'open')
  const activeHackathons = hackathons.filter((h) => h.status !== 'closed' && h.status !== 'cancelled')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Judge Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Here's your judging overview.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Hackathons"
          value={activeHackathons.length}
          icon={<Trophy className="size-6" />}
          href="/hackathons"
        />
        <StatCard
          title="Open for Scoring"
          value={openHackathons.length}
          icon={<Gavel className="size-6" />}
          href="/hackathons"
        />
        <StatCard
          title="Total Assigned"
          value={hackathons.length}
          icon={<CheckCircle2 className="size-6" />}
          href="/hackathons"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/hackathons">
              <Trophy className="mr-2 size-4" />
              View Hackathons
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/submissions">
              <FileUp className="mr-2 size-4" />
              Review Submissions
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/winners">
              <CheckCircle2 className="mr-2 size-4" />
              View Winners
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Hackathons */}
      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Hackathons</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hackathons">
              View all
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        {activeHackathons.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeHackathons.slice(0, 6).map((hackathon) => (
              <Link
                key={hackathon.id}
                href={`/hackathons/${hackathon.id}`}
                className="rounded-md border border-cs-border bg-cs-card/50 p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Trophy className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{hackathon.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                      {hackathon.shortDescription}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          {new Date(hackathon.scoringDeadline).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        hackathon.status === 'open'
                          ? 'bg-green-500/10 text-green-500'
                          : hackathon.status === 'submission_closed'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {hackathon.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">No active hackathons assigned</p>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-cs-border bg-blue-500/10 p-6">
        <div className="flex items-start gap-3">
          <Gavel className="mt-0.5 size-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-blue-500">Judging Guidelines</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              As a judge, you can review and score submissions for hackathons you're assigned to.
              Visit the hackathons page to see submissions and provide your scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
