'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HackathonCard } from '@/components/hackathon-card'
import { getHackathons } from '@/lib/auth-api'
import {
  Trophy,
  FileUp,
  ArrowRight,
  Users,
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
      <div className="glass cs-card rounded-lg border border-cs-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/hackathons">
              <Trophy className="mr-2 size-4" />
              My Hackathons
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
      <div className="glass cs-card rounded-lg border border-cs-border p-6">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 400px))' }}>
            {myHackathons.slice(0, 6).map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                variant="list"
                isAdmin={false}
                isParticipant={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 text-sm">No hackathons yet</p>
        )}
      </div>
    </div>
  )
}
