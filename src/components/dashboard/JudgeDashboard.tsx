'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getHackathons } from '@/lib/auth-api'
import {
  Trophy,
  FileUp,
  Gavel,
  CheckCircle2,
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

export default function JudgeDashboard() {
  const { user } = useAuth()

  // Fetch hackathons assigned to this judge
  const { data: hackathonsData } = useQuery({
    queryKey: ['dashboard', 'judge-hackathons'],
    queryFn: () => getHackathons({ page: 1, limit: 10, forJudge: 'me' }),
  })

  const hackathons = hackathonsData?.data ?? []
  const openHackathons = hackathons.filter((h) => h.status === 'open')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Judge Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Here's your judging overview.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Open for Scoring"
          value={openHackathons.length}
          icon={<Gavel className="size-6" />}
          href="/judge/hackathons"
        />
        <StatCard
          title="Total Assigned"
          value={hackathons.length}
          icon={<CheckCircle2 className="size-6" />}
          href="/judge/hackathons"
        />
      </div>

      {/* Quick Actions */}
      <div className="glass cs-card rounded-lg border border-cs-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/judge/hackathons">
              <Trophy className="mr-2 size-4" />
              Hackathons to judge
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/judge/hackathons">
              <FileUp className="mr-2 size-4" />
              View and score submissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-cs-border bg-blue-500/10 p-6">
        <div className="flex items-start gap-3">
          <Gavel className="mt-0.5 size-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-blue-500">Judging Guidelines</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              As a judge, you can view and score submissions for hackathons you're assigned to.
              Use &quot;View and score submissions&quot; or the sidebar &quot;Score submissions&quot; to open your assigned hackathons and submit scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
