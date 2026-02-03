'use client'

import { Button } from '@/components/ui/button'
import { fetchJudgeChallenges, type JudgeChallenge } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Calendar, FileCheck } from 'lucide-react'
import Link from 'next/link'

export default function JudgeDashboardPage() {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['judge', 'challenges'],
    queryFn: fetchJudgeChallenges,
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Judge dashboard</h1>
        <p className="p1 mt-1 text-cs-text">Challenges assigned to you for evaluation.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">No challenges assigned yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(challenges as JudgeChallenge[]).map((c) => (
            <li key={c.id}>
              <Link
                href={`/judge/submissions?challenge=${c.id}`}
                className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
              >
                <h3 className="font-semibold text-cs-heading">{c.title}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-cs-text">
                  <Calendar className="size-3.5" />
                  Deadline: {new Date(c.submissionDeadline).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-cs-text">
                  <FileCheck className="size-3.5" />
                  {c.scoredSubmissions ?? 0} scored / {c.pendingSubmissions ?? 0} pending
                </div>
                <span className="mt-2 inline-block rounded-full border border-cs-border px-2 py-0.5 text-xs capitalize text-cs-text">
                  {c.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button variant="outline" asChild>
          <Link href="/judge/submissions">View all submissions</Link>
        </Button>
      </div>
    </div>
  )
}
