'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getHackathons } from '@/lib/auth-api'
import {
  Trophy,
  FileUp,
  Building2,
  ArrowRight,
  Plus,
  Calendar,
  Users,
  Award,
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

export default function SponsorDashboard() {
  const { user } = useAuth()

  // Fetch sponsor's hackathons
  const { data: hackathonsData } = useQuery({
    queryKey: ['dashboard', 'sponsor-hackathons', user?.id],
    queryFn: () => getHackathons({ page: 1, limit: 10, sponsorId: user?.id }),
    enabled: !!user?.id,
  })

  const myHackathons = hackathonsData?.data ?? []
  const activeHackathons = myHackathons.filter((h) => h.status !== 'closed' && h.status !== 'cancelled')
  const totalSubmissions = myHackathons.reduce((sum, h) => sum + (h._count?.submissions ?? 0), 0)
  const totalTeams = myHackathons.reduce((sum, h) => sum + (h._count?.teams ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Sponsor Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back, {user?.email}. Here's your hackathon overview.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="My Hackathons"
          value={myHackathons.length}
          icon={<Trophy className="size-6" />}
          href="/hackathons"
        />
        <StatCard
          title="Active"
          value={activeHackathons.length}
          icon={<Trophy className="size-6" />}
          href="/hackathons"
        />
        <StatCard
          title="Total Submissions"
          value={totalSubmissions}
          icon={<FileUp className="size-6" />}
        />
        <StatCard
          title="Total Teams"
          value={totalTeams}
          icon={<Users className="size-6" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/hackathons">
              <Trophy className="mr-2 size-4" />
              My Hackathons
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/submissions">
              <FileUp className="mr-2 size-4" />
              View Submissions
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/winners">
              <Award className="mr-2 size-4" />
              Select Winners
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/users/teams">
              <Users className="mr-2 size-4" />
              View Teams
            </Link>
          </Button>
        </div>
      </div>

      {/* My Hackathons */}
      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Hackathons</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hackathons">
              View all
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
        {myHackathons.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myHackathons.slice(0, 6).map((hackathon) => (
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
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Submissions</span>
                        <span className="font-medium">{hackathon._count?.submissions ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Teams</span>
                        <span className="font-medium">{hackathon._count?.teams ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          Deadline: {new Date(hackathon.submissionDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        hackathon.status === 'open'
                          ? 'bg-green-500/10 text-green-500'
                          : hackathon.status === 'submission_closed'
                            ? 'bg-amber-500/10 text-amber-500'
                            : hackathon.status === 'closed'
                              ? 'bg-gray-500/10 text-gray-500'
                              : 'bg-red-500/10 text-red-500'
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
          <div className="space-y-3">
            <p className="text-muted-foreground text-center py-4 text-sm">No hackathons yet</p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/hackathons">
                <Plus className="mr-2 size-4" />
                Create Hackathon
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
