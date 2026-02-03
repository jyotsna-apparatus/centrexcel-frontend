'use client'

import { Button } from '@/components/ui/button'
import { fetchMySubmissions, type Submission } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function MySubmissionsPage() {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions', 'my'],
    queryFn: fetchMySubmissions,
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="h2 text-cs-heading">My submissions</h1>
          <p className="p1 mt-1 text-cs-text">Submissions you have created.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/submissions/create">New submission</Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">You have no submissions yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/submissions/create">Create submission</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(submissions as Submission[]).map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/submissions/${s.id}`}
                className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
              >
                <h3 className="font-semibold text-cs-heading">{s.title}</h3>
                <p className="mt-1 text-sm text-cs-text">{s.challenge?.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-cs-text">
                  <span className={s.isDraft ? 'text-amber-500' : ''}>
                    {s.isDraft ? 'Draft' : 'Final'}
                  </span>
                  {s.score != null && (
                    <span>Score: {s.score}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
