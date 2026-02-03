'use client'

import { Button } from '@/components/ui/button'
import { fetchInvites, revokeInvite, type Invite } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminInvitationsPage() {
  const { data: invites = [], isLoading, refetch } = useQuery({
    queryKey: ['auth', 'invites'],
    queryFn: fetchInvites,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      refetch()
      toast.success('Invitation revoked')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">All invitations</h1>
        <p className="p1 mt-1 text-cs-text">View and manage all sent invitations.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-cs-card" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="rounded-lg border border-cs-border bg-cs-card p-8 text-center">
          <p className="p1 text-cs-text">No invitations.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(invites as Invite[]).map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cs-border bg-cs-card p-4"
            >
              <div className="flex items-center gap-3">
                <Mail className="size-5 shrink-0 text-cs-text" />
                <div>
                  <p className="font-medium text-cs-heading">{inv.name}</p>
                  <p className="text-sm text-cs-text">{inv.email}</p>
                  <p className="text-xs text-cs-text capitalize">
                    {inv.status} · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {inv.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeMutation.mutate(inv.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
