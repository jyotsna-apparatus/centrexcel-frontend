'use client'

import { Button } from '@/components/ui/button'
import { fetchChallengeById, uploadProblemStatement } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export default function UploadProblemStatementPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => fetchChallengeById(id),
    enabled: !!id,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProblemStatement(id, file),
    onSuccess: () => {
      toast.success('Problem statement uploaded')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed')
      return
    }
    setUploading(true)
    try {
      await uploadMutation.mutateAsync(file)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

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

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <Link href={`/sponsor/challenges/${id}/edit`} className="link-highlight text-sm">
          ← Back to challenge
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Upload problem statement</h1>
        <p className="p1 mt-1 text-cs-text">
          {challenge?.title}. PDF only.
        </p>
      </header>

      <div className="rounded-lg border border-cs-border bg-cs-card p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <FileText className="size-4" />
          {uploading ? 'Uploading…' : 'Choose PDF'}
        </Button>
      </div>
    </div>
  )
}
