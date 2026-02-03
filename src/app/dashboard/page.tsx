'use client'

import { Button } from '@/components/ui/button'
import {
  fetchMe,
  fetchMyParticipations,
  fetchMyTeams,
} from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })
  const { data: participations = [], isLoading: loadingParticipations } = useQuery({
    queryKey: ['participations', 'my'],
    queryFn: fetchMyParticipations,
  })
  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: fetchMyTeams,
  })

  const isLoading = loadingUser || loadingParticipations || loadingTeams
  const liveParticipations = participations.filter(
    (p) => p.challenge?.status === 'live' || p.challenge?.status === 'upcoming'
  )

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">
          Welcome back{user?.name ? `, ${user.name}` : ''}.
        </p>
      </header>

      <section>
        <h2 className="h3 text-cs-heading">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/challenges">Browse challenges</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/participations">My participations</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/teams">My teams</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/submissions">My submissions</Link>
          </Button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="h3 text-cs-heading">Active participations</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/participations">View all</Link>
          </Button>
        </div>
        {loadingParticipations ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-cs-card" />
            ))}
          </div>
        ) : liveParticipations.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">You have no active participations.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveParticipations.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/challenges/${p.challengeId}`}
                  className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
                >
                  <h3 className="font-semibold text-cs-heading">
                    {p.challenge?.title ?? 'Challenge'}
                  </h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-cs-text">
                    <Calendar className="size-3.5" />
                    {p.challenge?.submissionDeadline
                      ? new Date(p.challenge.submissionDeadline).toLocaleDateString()
                      : p.mode}
                  </p>
                  <p className="mt-1 text-xs capitalize text-cs-text">
                    {p.mode}
                    {p.team?.name ? ` · ${p.team.name}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="h3 text-cs-heading">My teams</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/teams/join">Join team</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/teams/create">Create team</Link>
            </Button>
          </div>
        </div>
        {loadingTeams ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-cs-card" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">You are not in any teams yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/teams/${t.id}`}
                  className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
                >
                  <h3 className="font-semibold text-cs-heading">{t.name}</h3>
                  <p className="mt-1 text-sm text-cs-text">{t.challenge?.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-cs-text">
                    <Users className="size-3.5" />
                    {t.memberCount ?? 0} member(s)
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
