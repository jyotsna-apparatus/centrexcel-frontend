'use client'

import { Button } from '@/components/ui/button'
import {
  fetchSubmissionById,
  finalizeSubmission,
  uploadSubmissionFile,
  type Submission,
} from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText, Link2, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export default function SubmissionDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: submission, isLoading, error, refetch } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => fetchSubmissionById(id),
    enabled: !!id,
  })

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeSubmission(id),
    onSuccess: () => {
      refetch()
      toast.success('Submission finalized')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const valid = ['.pdf', '.ppt', '.pptx'].some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
    if (!valid) {
      toast.error('Only PDF and PPT/PPTX are allowed')
      return
    }
    setUploading(true)
    try {
      await uploadSubmissionFile(id, file)
      toast.success('File uploaded')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
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

  return (
    <div className="space-y-8">
      <header>
        <Link href="/dashboard/submissions" className="link-highlight text-sm">
          ← Back to submissions
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">{s.title}</h1>
        <p className="p1 mt-1 text-cs-text">{s.challenge?.title}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs ${
              s.isDraft ? 'border-amber-500/50 text-amber-500' : 'border-cs-border text-cs-text'
            }`}
          >
            {s.isDraft ? 'Draft' : 'Final'}
          </span>
          {s.score != null && (
            <span className="text-sm text-cs-text">Score: {s.score}</span>
          )}
        </div>
      </header>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Idea</h2>
        <p className="mt-2 whitespace-pre-wrap text-cs-text">{s.idea}</p>
      </section>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Solution</h2>
        <p className="mt-2 whitespace-pre-wrap text-cs-text">{s.solution}</p>
      </section>

      {s.links && s.links.length > 0 && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
            <Link2 className="size-4" />
            Links
          </h2>
          <ul className="mt-2 space-y-1">
            {s.links.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-highlight break-all text-sm"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.fileUrl && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
            <FileText className="size-4" />
            Attached file
          </h2>
          <a
            href={s.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-highlight mt-2 inline-block text-sm"
          >
            View file
          </a>
        </section>
      )}

      {s.feedback && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Judge feedback</h2>
          <p className="mt-2 whitespace-pre-wrap text-cs-text">{s.feedback}</p>
        </section>
      )}

      {s.isDraft && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/submissions/${id}/edit`}>Edit draft</Link>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <FileText className="size-4" />
              {uploading ? 'Uploading…' : 'Upload PDF/PPT'}
            </Button>
            <Button
              size="sm"
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
            >
              <Send className="size-4" />
              Finalize submission
            </Button>
          </div>
        </section>
      )}

      <div>
        <Link href="/dashboard/submissions" className="link-highlight text-sm">
          Back to submissions
        </Link>
      </div>
    </div>
  )
}
