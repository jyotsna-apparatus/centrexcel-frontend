'use client'

import { Button } from '@/components/ui/button'
import { fetchChallengeById, publishResults } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Award } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PublishResultsPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''

  const { data: challenge, isLoading, error } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => fetchChallengeById(id),
    enabled: !!id,
  })

  const publishMutation = useMutation({
    mutationFn: () => publishResults(id),
    onSuccess: () => {
      toast.success('Results published')
      router.push('/sponsor')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!id) {
    return (
      <div>
        <p className="p1 text-cs-text">Invalid challenge.</p>
        <Link href="/sponsor" className="link-highlight mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (isLoading && !challenge) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-48 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div>
        <p className="p1 text-destructive">Challenge not found.</p>
        <Link href="/sponsor" className="link-highlight mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <Link href={`/sponsor/challenges/${id}/edit`} className="link-highlight text-sm">
          ← Back to challenge
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Publish results</h1>
        <p className="p1 mt-1 text-cs-text">
          Publish results for {challenge.title}. This will set the challenge status to
          &quot;results_published&quot; so participants can see scores.
        </p>
      </header>

      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <Button
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
        >
          <Award className="size-4" />
          Publish results
        </Button>
      </div>
    </div>
  )
}
