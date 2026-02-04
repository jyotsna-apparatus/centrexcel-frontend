'use client'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  deleteChallenge,
  fetchChallenges,
  updateChallenge,
  type ChallengeStatus,
} from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

const STATUS_OPTIONS: { value: ChallengeStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'closed', label: 'Closed' },
  { value: 'results_published', label: 'Results published' },
]

export default function AdminChallengesPage() {
  const queryClient = useQueryClient()
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ChallengeStatus }) =>
      updateChallenge(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Challenge status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      toast.success('Challenge deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  })

  const handleStatusChange = (challengeId: string, status: ChallengeStatus) => {
    updateStatusMutation.mutate({ id: challengeId, status })
  }

  const openDeleteDialog = (id: string, title: string) => {
    setDeleteDialog({ open: true, id, title })
  }

  const handleConfirmDelete = async () => {
    if (deleteDialog.id) {
      await deleteMutation.mutateAsync(deleteDialog.id)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Manage challenges</h1>
        <p className="p1 mt-1 text-cs-text">View all challenges on the platform.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">No challenges.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <li key={c.id}>
              <div className="rounded-lg border border-cs-border bg-cs-card p-4 transition-colors hover:border-cs-primary/40">
                <Link href={`/challenges/${c.id}`} className="block">
                  <h3 className="font-semibold text-cs-heading">{c.title}</h3>
                  <p className="mt-1 flex items-center gap-2 text-xs text-cs-text">
                    <Calendar className="size-3.5" />
                    {new Date(c.endDate).toLocaleDateString()}
                  </p>
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={c.status}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleStatusChange(c.id, e.target.value as ChallengeStatus)
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-md border border-cs-border bg-transparent px-2 py-1 text-xs text-cs-heading outline-none focus:border-cs-primary"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/sponsor/challenges/${c.id}/edit`} onClick={(e) => e.stopPropagation()}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteDialog(c.id, c.title)
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Delete challenge"
        description="Are you sure you want to delete this challenge? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
        loading={false}
      />
    </div>
  )
}
