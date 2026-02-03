'use client'

import { Button } from '@/components/ui/button'
import { fetchChallenges } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

export default function AdminChallengesPage() {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Manage challenges</h1>
        <p className="p1 mt-1 text-cs-text">View all challenges on the platform.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">No challenges.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <li key={c.id}>
              <Link
                href={`/challenges/${c.id}`}
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
    </div>
  )
}
