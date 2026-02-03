'use client'

import { Button } from '@/components/ui/button'
import { fetchMyParticipations, type Participation } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function MyParticipationsPage() {
  const { data: participations = [], isLoading } = useQuery({
    queryKey: ['participations', 'my'],
    queryFn: fetchMyParticipations,
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">My participations</h1>
        <p className="p1 mt-1 text-cs-text">Challenges you have registered for.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : participations.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">You have not registered for any challenges yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/challenges">Browse challenges</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(participations as Participation[]).map((p) => (
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
                    : '—'}
                </p>
                <p className="mt-1 text-xs capitalize text-cs-text">
                  {p.mode}
                  {p.team?.name ? ` · ${p.team.name}` : ''}
                </p>
                <span className="mt-2 inline-block rounded-full border border-cs-border px-2 py-0.5 text-xs capitalize text-cs-text">
                  {p.challenge?.status ?? '—'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
