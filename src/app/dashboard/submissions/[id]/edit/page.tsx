'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSubmissionById, updateSubmission, type Submission } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function EditSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [title, setTitle] = useState('')
  const [idea, setIdea] = useState('')
  const [solution, setSolution] = useState('')
  const [linksStr, setLinksStr] = useState('')

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmissionById(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: { title: string; idea: string; solution: string; links?: string[] }) =>
      updateSubmission(id, body),
    onSuccess: () => {
      toast.success('Submission updated')
      router.push(`/dashboard/submissions/${id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (!submission) return
    const s = submission as Submission
    setTitle(s.title)
    setIdea(s.idea)
    setSolution(s.solution)
    setLinksStr(s.links?.join('\n') ?? '')
  }, [submission])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !idea.trim() || !solution.trim()) {
      toast.error('Fill required fields')
      return
    }
    const links = linksStr
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    updateMutation.mutate({
      title: title.trim(),
      idea: idea.trim(),
      solution: solution.trim(),
      links: links.length > 0 ? links : undefined,
    })
  }

  if (!id) {
    return (
      <div>
        <p className="p1 text-cs-text">Invalid submission.</p>
        <Link href="/dashboard/submissions" className="link-highlight mt-2 inline-block">
          Back to submissions
        </Link>
      </div>
    )
  }

  if (isLoading && !submission) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-64 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div>
        <p className="p1 text-destructive">Submission not found.</p>
        <Link href="/dashboard/submissions" className="link-highlight mt-2 inline-block">
          Back to submissions
        </Link>
      </div>
    )
  }

  const s = submission as Submission
  if (!s.isDraft) {
    return (
      <div>
        <p className="p1 text-cs-text">This submission is finalized and cannot be edited.</p>
        <Link href={`/dashboard/submissions/${id}`} className="link-highlight mt-2 inline-block">
          View submission
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <Link href={`/dashboard/submissions/${id}`} className="link-highlight text-sm">
          ← Back to submission
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Edit submission</h1>
        <p className="p1 mt-1 text-cs-text">{s.title}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-cs-heading">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="idea" className="mb-1 block text-sm font-medium text-cs-heading">
            Idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="solution" className="mb-1 block text-sm font-medium text-cs-heading">
            Solution
          </label>
          <textarea
            id="solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="links" className="mb-1 block text-sm font-medium text-cs-heading">
            Links (one per line or comma-separated)
          </label>
          <textarea
            id="links"
            value={linksStr}
            onChange={(e) => setLinksStr(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            Save changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/submissions/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
