'use client'

import { Button } from '@/components/ui/button'
import { fetchChallenges } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Admin dashboard</h1>
        <p className="p1 mt-1 text-cs-text">Platform overview and management.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/challenges/create">Create challenge</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/judges/invite">Invite judges</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/challenges">Manage challenges</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/judges/assign">Assign judges</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/invitations">All invitations</Link>
        </Button>
      </div>

      <section>
        <h2 className="h3 text-cs-heading">All challenges</h2>
        {isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">No challenges.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/challenges?challenge=${c.id}`}
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
