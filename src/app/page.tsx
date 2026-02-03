'use client'

import { Button } from '@/components/ui/button'
import {
  fetchLiveChallenges,
  type Challenge,
} from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

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
          <Link href={`/challenges/${c.id}`}>View</Link>
        </Button>
      </div>
    </article>
  )
}

export default function LandingPage() {
  const { data: liveChallenges = [], isLoading } = useQuery({
    queryKey: ['challenges', 'live'],
    queryFn: fetchLiveChallenges,
  })

  return (
    <div className="min-h-[100dvh] bg-cs-black">
      <div className="pattern" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="h1 text-cs-heading">Centrexcel</h1>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/challenges">Challenges</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </nav>
        </header>

        <section className="mt-16 text-center">
          <h2 className="h2 text-cs-heading">Build. Compete. Win.</h2>
          <p className="p1 mt-4 max-w-2xl mx-auto text-cs-text">
            Join live challenges, form teams, and submit your best solutions. From hackathons to
            startup challenges—one platform for it all.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/challenges">Browse challenges</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="h3 text-cs-heading">Live challenges</h2>
          <p className="p1 mt-1 text-cs-text">Currently open for registration and submissions.</p>
          {isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg border border-cs-border bg-cs-card"
                />
              ))}
            </div>
          ) : liveChallenges.length === 0 ? (
            <p className="p1 mt-6 text-cs-text">No live challenges right now. Check back soon.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveChallenges.slice(0, 6).map((c) => (
                <ChallengeCard key={c.id} c={c} />
              ))}
            </div>
          )}
          {liveChallenges.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/challenges">View all challenges</Link>
              </Button>
            </div>
          )}
        </section>

        <footer className="mt-24 border-t border-cs-border pt-8 text-center text-sm text-cs-text">
          <Link href="/challenges" className="link-highlight">
            Challenges
          </Link>
          {' · '}
          <Link href="/auth/login" className="link-highlight">
            Login
          </Link>
          {' · '}
          <Link href="/auth/sign-up" className="link-highlight">
            Sign up
          </Link>
        </footer>
      </div>
    </div>
  )
}
