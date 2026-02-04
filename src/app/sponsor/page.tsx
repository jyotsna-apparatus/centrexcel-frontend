'use client'

import { fetchChallenges, fetchMe } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

export default function SponsorDashboardPage() {
  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  const myChallenges = user?.id
    ? challenges.filter((c) => c.createdBy === user.id)
    : []

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Sponsor dashboard</h1>
        <p className="p1 mt-1 text-cs-text">View and manage your challenges.</p>
      </header>

      <section>
        <h2 className="h3 text-cs-heading">Your challenges</h2>
        {isLoading || !user ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
            ))}
          </div>
        ) : myChallenges.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">You have no challenges yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myChallenges.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/sponsor/challenges/${c.id}/edit`}
                  className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
                >
                  <h3 className="font-semibold text-cs-heading">{c.title}</h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-cs-text">
                    <Calendar className="size-3.5" />
                    {new Date(c.endDate).toLocaleDateString()}
                  </p>
                  <span className="mt-2 inline-block rounded-full border border-cs-border px-2 py-0.5 text-xs capitalize text-cs-text">
                    {c.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
