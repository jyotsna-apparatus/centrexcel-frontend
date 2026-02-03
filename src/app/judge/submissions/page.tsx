'use client'

import { Button } from '@/components/ui/button'
import { fetchJudgeSubmissions, type Submission } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function JudgeSubmissionsPage() {
  const searchParams = useSearchParams()
  const challengeId = searchParams.get('challenge')

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['judge', 'submissions'],
    queryFn: fetchJudgeSubmissions,
  })

  const filtered = challengeId
    ? submissions.filter((s) => s.challengeId === challengeId)
    : submissions

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Submissions to judge</h1>
        <p className="p1 mt-1 text-cs-text">Evaluate and score submissions.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">No submissions to judge.</p>
          <Link href="/judge" className="link-highlight mt-2 inline-block">
            Back to judge dashboard
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(filtered as Submission[]).map((s) => (
            <li key={s.id}>
              <Link
                href={`/judge/submissions/${s.id}`}
                className="block rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40"
              >
                <h3 className="font-semibold text-cs-heading">{s.title}</h3>
                <p className="mt-1 text-sm text-cs-text">{s.challenge?.title}</p>
                {s.team?.name && (
                  <p className="mt-1 text-xs text-cs-text">Team: {s.team.name}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-cs-text">
                  <FileText className="size-3.5" />
                  {s.score != null ? `Scored: ${s.score}` : 'Not scored'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
