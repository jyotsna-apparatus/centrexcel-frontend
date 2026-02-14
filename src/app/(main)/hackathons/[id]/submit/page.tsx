'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSubmission } from '@/lib/auth-api'
import { useHackathon } from '@/hooks/use-hackathons'
import PageHeader from '@/components/pageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, FileUp } from 'lucide-react'
import { toast } from 'sonner'

export default function HackathonSubmitPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const id = typeof params.id === 'string' ? params.id : ''
  const solo = searchParams.get('solo') === '1'
  const teamId = searchParams.get('teamId') ?? undefined

  const { data: hackathon, isLoading: hackathonLoading } = useHackathon(id || null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const submitMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; file: File }) =>
      createSubmission({
        hackathonId: id,
        title: payload.title,
        description: payload.description,
        file: payload.file,
        teamId: solo ? undefined : teamId,
      }),
    onSuccess: () => {
      toast.success('Submission created successfully.')
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      router.push('/submissions')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create submission')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) {
      toast.error('Please enter a title.')
      return
    }
    if (!file) {
      toast.error('Please select a file to upload.')
      return
    }
    submitMutation.mutate({ title: t, description: description.trim(), file })
  }

  if (!id) {
    return (
      <div>
        <PageHeader title="Submit" description="Invalid hackathon." />
        <Button variant="outline" asChild>
          <Link href="/hackathons">Back to hackathons</Link>
        </Button>
      </div>
    )
  }

  if (hackathonLoading || !hackathon) {
    return (
      <div>
        <PageHeader title="Submit" description="Loading..." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={solo ? `Submit as solo — ${hackathon.title}` : `Submit project — ${hackathon.title}`}
        description={
          solo
            ? 'Upload your project for this hackathon. You are entering as a solo participant.'
            : 'Upload your team project. Only one submission per team.'
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hackathons/${id}${solo ? '' : '/apply'}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
        <div>
          <label htmlFor="submit-title" className="mb-1.5 block text-sm font-medium text-cs-heading">
            Project title
          </label>
          <Input
            id="submit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your project title"
            disabled={submitMutation.isPending}
            className="w-full"
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="submit-desc" className="mb-1.5 block text-sm font-medium text-cs-heading">
            Description (optional)
          </label>
          <textarea
            id="submit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your project"
            disabled={submitMutation.isPending}
            className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="submit-file" className="mb-1.5 block text-sm font-medium text-cs-heading">
            <FileUp className="mr-1.5 inline size-4" />
            Upload file (required)
          </label>
          <Input
            id="submit-file"
            type="file"
            accept=".zip,.tar.gz,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={submitMutation.isPending}
            className="w-full"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your project (e.g. ZIP or PDF). Check hackathon instructions for allowed formats.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitMutation.isPending || !file}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit project'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/hackathons/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
