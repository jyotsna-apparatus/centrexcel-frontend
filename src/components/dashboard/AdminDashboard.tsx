'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUsers, getTeams } from '@/lib/auth-api'
import {
  UsersRound,
  Trophy,
  Users,
  Gavel,
  Building2,
  UserCheck,
  ArrowRight,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Select } from '@/components/ui/select'
import { useState } from 'react'
import ParticipantDashboard from './ParticipantDashboard'
import JudgeDashboard from './JudgeDashboard'
import SponsorDashboard from './SponsorDashboard'

type StatCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
  href?: string
  trend?: string
  className?: string
}

function StatCard({ title, value, icon, href, trend, className = '' }: StatCardProps) {
  const content = (
    <div className={`rounded-lg border border-cs-border bg-cs-card p-6 shadow-sm transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-muted-foreground mt-1 text-xs">{trend}</p>
          )}
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

export default function AdminDashboard() {
  const { user } = useAuth()
  const [dashboardView, setDashboardView] = useState<'admin' | 'participant' | 'judge' | 'sponsor'>('admin')

  // Fetch statistics
  const { data: participantsData } = useQuery({
    queryKey: ['dashboard', 'participants'],
    queryFn: () => getUsers({ page: 1, limit: 1, role: 'participant' }),
    enabled: dashboardView === 'admin',
  })

  const { data: judgesData } = useQuery({
    queryKey: ['dashboard', 'judges'],
    queryFn: () => getUsers({ page: 1, limit: 1, role: 'judge' }),
    enabled: dashboardView === 'admin',
  })

  const { data: sponsorsData } = useQuery({
    queryKey: ['dashboard', 'sponsors'],
    queryFn: () => getUsers({ page: 1, limit: 1, role: 'sponsor' }),
    enabled: dashboardView === 'admin',
  })

  const { data: teamsData } = useQuery({
    queryKey: ['dashboard', 'teams'],
    queryFn: () => getTeams({ page: 1, limit: 1 }),
    enabled: dashboardView === 'admin',
  })

  const totalParticipants = participantsData?.pagination?.total ?? 0
  const totalJudges = judgesData?.pagination?.total ?? 0
  const totalSponsors = sponsorsData?.pagination?.total ?? 0
  const totalTeams = teamsData?.pagination?.total ?? 0
  const totalUsers = totalParticipants + totalJudges + totalSponsors

  // Get recent data for activity
  const { data: recentParticipants } = useQuery({
    queryKey: ['dashboard', 'recent-participants'],
    queryFn: () => getUsers({ page: 1, limit: 5, role: 'participant' }),
    enabled: dashboardView === 'admin',
  })

  const { data: recentTeams } = useQuery({
    queryKey: ['dashboard', 'recent-teams'],
    queryFn: () => getTeams({ page: 1, limit: 5 }),
    enabled: dashboardView === 'admin',
  })

  const recentParticipantsList = recentParticipants?.data?.slice(0, 5) ?? []
  const recentTeamsList = recentTeams?.data?.slice(0, 5) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h2 text-cs-heading">Admin Dashboard</h1>
          <p className="p1 mt-1 text-cs-text">
            Welcome back, {user?.email}. Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-view" className="text-sm font-medium text-muted-foreground">
            View as:
          </label>
          <Select
            id="dashboard-view"
            value={dashboardView}
            onChange={(e) => setDashboardView(e.target.value as typeof dashboardView)}
            className="w-40"
          >
            <option value="admin">Admin</option>
            <option value="participant">Participant</option>
            <option value="judge">Judge</option>
            <option value="sponsor">Sponsor</option>
          </Select>
        </div>
      </div>

      {dashboardView === 'admin' && (
        <>
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<UsersRound className="size-6" />}
              href="/users/participants"
              trend={`${totalParticipants} participants, ${totalJudges} judges, ${totalSponsors} sponsors`}
            />
            <StatCard
              title="Participants"
              value={totalParticipants}
              icon={<UserCheck className="size-6" />}
              href="/users/participants"
              trend="Active users"
            />
            <StatCard
              title="Teams"
              value={totalTeams}
              icon={<Users className="size-6" />}
              href="/users/teams"
              trend="Active teams"
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
          <div className="rounded-lg border border-cs-border bg-cs-card p-6">
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
                  View Hackathons
                </Link>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Participants */}
            <div className="rounded-lg border border-cs-border bg-cs-card p-6">
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
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserCheck className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {participant.username || participant.email}
                          </p>
                          <p className="text-muted-foreground text-sm">{participant.email}</p>
                        </div>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {participant.createdAt
                          ? new Date(participant.createdAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No participants yet</p>
              )}
            </div>

            {/* Recent Teams */}
            <div className="rounded-lg border border-cs-border bg-cs-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Teams</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/users/teams">
                    View all
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
              {recentTeamsList.length > 0 ? (
                <div className="space-y-3">
                  {recentTeamsList.map((team) => (
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
                            {team.hackathon?.title ?? 'No hackathon'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">
                          {team.members?.length ?? 0} members
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {team.createdAt
                            ? new Date(team.createdAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No teams yet</p>
              )}
            </div>
          </div>

          {/* User Breakdown */}
          <div className="rounded-lg border border-cs-border bg-cs-card p-6">
            <h2 className="mb-4 text-lg font-semibold">User Breakdown</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-cs-border bg-cs-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Participants</p>
                    <p className="text-2xl font-bold">{totalParticipants}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-cs-border bg-cs-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/10 p-2 text-purple-500">
                    <Gavel className="size-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Judges</p>
                    <p className="text-2xl font-bold">{totalJudges}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-cs-border bg-cs-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2 text-green-500">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Sponsors</p>
                    <p className="text-2xl font-bold">{totalSponsors}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {dashboardView === 'participant' && <ParticipantDashboard />}
      {dashboardView === 'judge' && <JudgeDashboard />}
      {dashboardView === 'sponsor' && <SponsorDashboard />}
    </div>
  )
}
