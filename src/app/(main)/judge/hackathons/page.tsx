'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useJudgeHackathons } from '@/hooks/use-hackathons'
import { useAuth } from '@/contexts/auth-context'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, FileUp } from 'lucide-react'
import { toast } from 'sonner'

export default function JudgeHackathonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data, isLoading, isError, error } = useJudgeHackathons({ page: 0, pageSize: 50 })

  useEffect(() => {
    if (user && user.role !== 'judge') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const hackathons = data?.data ?? []

  if (user && user.role !== 'judge') {
    return null
  }

  if (isError && error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load hackathons')
  }

  return (
    <div>
      <PageHeader
        title="Hackathons to judge"
        description="Select a hackathon to view and score submissions."
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : hackathons.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-card p-8 text-center">
          <Trophy className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            You are not assigned to any hackathons yet.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/hackathons">Browse all hackathons</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hackathons.map((h) => (
            <Link
              key={h.id}
              href={`/judge/hackathons/${h.id}/submissions`}
              className="flex items-center gap-4 rounded-lg border border-cs-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="rounded-full bg-primary/10 p-3">
                <FileUp className="size-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-cs-heading truncate">{h.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {h._count?.submissions ?? 0} submission{(h._count?.submissions ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
