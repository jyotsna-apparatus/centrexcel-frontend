'use client'

import { Button } from '@/components/ui/button'
import { fetchChallenges } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function SponsorDashboardPage() {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  const myChallenges = challenges

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Sponsor dashboard</h1>
        <p className="p1 mt-1 text-cs-text">Manage your challenges and judges.</p>
      </header>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/sponsor/challenges/create">Create challenge</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/sponsor/judges/invite">Invite judges</Link>
        </Button>
      </div>

      <section>
        <h2 className="h3 text-cs-heading">Challenges</h2>
        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
            ))}
          </div>
        ) : myChallenges.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">No challenges yet. Create one to get started.</p>
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
