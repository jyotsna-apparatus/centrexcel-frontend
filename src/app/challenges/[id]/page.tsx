'use client'

import { Button } from '@/components/ui/button'
import { fetchChallengeById, type Challenge } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Award, Calendar, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function ChallengeDetailsPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  const { data: challenge, isLoading, error } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => fetchChallengeById(id),
    enabled: !!id,
  })

  if (!id) {
    return (
      <div className="min-h-[100dvh] bg-cs-black p-8">
        <p className="p1 text-cs-text">Invalid challenge.</p>
        <Link href="/challenges" className="link-highlight mt-2 inline-block">
          Back to challenges
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-cs-black p-8">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-3/4 rounded bg-cs-card" />
          <div className="h-4 w-full rounded bg-cs-card" />
          <div className="h-4 w-5/6 rounded bg-cs-card" />
        </div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="min-h-[100dvh] bg-cs-black p-8">
        <p className="p1 text-cs-text">Challenge not found.</p>
        <Link href="/challenges" className="link-highlight mt-2 inline-block">
          Back to challenges
        </Link>
      </div>
    )
  }

  const c = challenge as Challenge
  const isOpen = c.status === 'live' || c.status === 'upcoming'

  return (
    <div className="min-h-[100dvh] bg-cs-black">
      <div className="pattern" aria-hidden />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <Link href="/challenges" className="link-highlight text-sm">
            ← Back to challenges
          </Link>
        </div>

        <header className="rounded-lg border border-cs-border bg-cs-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="h2 text-cs-heading">{c.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-cs-border px-2 py-0.5 text-xs capitalize text-cs-text">
                  {c.status}
                </span>
                <span className="rounded-full border border-cs-border px-2 py-0.5 text-xs text-cs-text">
                  {c.type}
                </span>
                {c.fee > 0 && (
                  <span className="rounded-full border border-cs-border px-2 py-0.5 text-xs text-cs-text">
                    Fee: ${c.fee}
                  </span>
                )}
              </div>
            </div>
            {isOpen && (
              <Button asChild>
                <Link href={`/challenges/${c.id}/register`}>Register</Link>
              </Button>
            )}
          </div>

          {c.sponsor && (
            <p className="mt-4 text-sm text-cs-text">
              By {c.sponsor.name}
              {c.sponsor.organization && ` · ${c.sponsor.organization}`}
            </p>
          )}
        </header>

        <section className="mt-6 rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-cs-text">{c.description}</p>
        </section>

        <section className="mt-6 rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Details</h2>
          <ul className="mt-3 space-y-2 text-sm text-cs-text">
            {c.startDate && (
              <li className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                Start: {formatDate(c.startDate)}
              </li>
            )}
            {c.endDate && (
              <li className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                End: {formatDate(c.endDate)}
              </li>
            )}
            {c.submissionDeadline && (
              <li className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                Submission deadline: {formatDate(c.submissionDeadline)}
              </li>
            )}
            {c.maxTeamSize > 0 && (
              <li className="flex items-center gap-2">
                <Users className="size-4 shrink-0" />
                Max team size: {c.maxTeamSize}
              </li>
            )}
            {c.problemStatementUrl && (
              <li className="flex items-center gap-2">
                <FileText className="size-4 shrink-0" />
                <a
                  href={c.problemStatementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-highlight"
                >
                  Problem statement (PDF)
                </a>
              </li>
            )}
          </ul>
        </section>

        {c.rewards && (
          <section className="mt-6 rounded-lg border border-cs-border bg-cs-card p-6">
            <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
              <Award className="size-4" />
              Rewards
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-cs-text">{c.rewards}</p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild variant="outline">
            <Link href="/challenges">All challenges</Link>
          </Button>
          {isOpen && (
            <Button asChild>
              <Link href={`/challenges/${c.id}/register`}>Register for this challenge</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
