'use client'

import { Button } from '@/components/ui/button'
import {
  fetchChallenges,
  fetchLiveChallenges,
  fetchUpcomingChallenges,
  type Challenge,
} from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type Tab = 'all' | 'live' | 'upcoming'

function ChallengeCard({ c }: { c: Challenge }) {
  const start = c.startDate ? new Date(c.startDate).toLocaleDateString() : ''
  const end = c.endDate ? new Date(c.endDate).toLocaleDateString() : ''
  return (
    <article className="rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40">
      <h3 className="font-semibold text-cs-heading">{c.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-cs-text">{c.description}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-cs-text">
        {c.maxTeamSize > 0 && (
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            Max {c.maxTeamSize} per team
          </span>
        )}
        {(start || end) && (
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {start}
            {end && ` – ${end}`}
          </span>
        )}
        {c.rewards && (
          <span className="flex items-center gap-1">
            <Award className="size-3.5" />
            Prizes
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full border border-cs-border px-2 py-0.5 text-xs capitalize text-cs-text">
          {c.status}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/challenges/${c.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  )
}

export default function ChallengesListPage() {
  const [tab, setTab] = useState<Tab>('all')

  const { data: allChallenges = [], isLoading: loadingAll } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })
  const { data: liveChallenges = [], isLoading: loadingLive } = useQuery({
    queryKey: ['challenges', 'live'],
    queryFn: fetchLiveChallenges,
  })
  const { data: upcomingChallenges = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['challenges', 'upcoming'],
    queryFn: fetchUpcomingChallenges,
  })

  const challenges = useMemo(() => {
    if (tab === 'live') return liveChallenges
    if (tab === 'upcoming') return upcomingChallenges
    return allChallenges
  }, [tab, allChallenges, liveChallenges, upcomingChallenges])

  const isLoading =
    tab === 'all' ? loadingAll : tab === 'live' ? loadingLive : loadingUpcoming

  return (
    <div className="min-h-[100dvh] bg-cs-black">
      <div className="pattern" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="h2 text-cs-heading">Challenges</h1>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </nav>
        </header>

        <div className="mt-8 flex gap-2 border-b border-cs-border">
          {(['all', 'live', 'upcoming'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-cs-primary text-cs-primary'
                  : 'border-transparent text-cs-text hover:text-cs-heading'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-lg border border-cs-border bg-cs-card"
              />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <p className="p1 mt-8 text-cs-text">No challenges in this category.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
