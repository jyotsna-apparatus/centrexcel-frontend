'use client'

import { Button } from '@/components/ui/button'
import { fetchMyTeams, type Team } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default function MyTeamsPage() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: fetchMyTeams,
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h2 text-cs-heading">My teams</h1>
          <p className="p1 mt-1 text-cs-text">Teams you belong to.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/teams/join">Join with code</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/teams/create">Create team</Link>
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">You are not in any teams yet.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard/teams/create">Create a team</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teams/join">Join with invite code</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(teams as Team[]).map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/teams/${t.id}`}
                className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
              >
                <h3 className="font-semibold text-cs-heading">{t.name}</h3>
                <p className="mt-1 text-sm text-cs-text">{t.challenge?.title}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-cs-text">
                  <Users className="size-3.5" />
                  {t.memberCount ?? 0} member(s)
                </p>
                <span className="mt-2 inline-block text-xs capitalize text-cs-text">
                  {t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
