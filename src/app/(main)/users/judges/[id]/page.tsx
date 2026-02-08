'use client'

import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/pageHeader/PageHeader'
import { getUser } from '@/lib/auth-api'
import { toast } from 'sonner'

export default function ViewJudgePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['judge', id],
    queryFn: () => getUser(id),
  })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Judge" description="View judge details." />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isError || !user) {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load judge')
    }
    return (
      <div>
        <PageHeader title="Judge" description="View judge details." />
        <Button variant="outline" asChild className="mt-4">
          <Link href="/users/judges">Back to list</Link>
        </Button>
      </div>
    )
  }

  const joinedDate = user.createdAt
    ? (() => {
        try {
          return new Date(user.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        } catch {
          return user.createdAt
        }
      })()
    : '—'

  return (
    <div>
      <PageHeader title="Judge" description="View judge details.">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/users/judges">Back to list</Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/users/judges/${id}/edit`}>Edit</Link>
          </Button>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <label htmlFor="view-username" className="text-muted-foreground mb-1 block text-sm font-medium">
            Username
          </label>
          <Input
            id="view-username"
            value={user.username ?? '—'}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div>
          <label htmlFor="view-email" className="text-muted-foreground mb-1 block text-sm font-medium">
            Email
          </label>
          <Input
            id="view-email"
            type="email"
            value={user.email}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div>
          <label htmlFor="view-role" className="text-muted-foreground mb-1 block text-sm font-medium">
            Role
          </label>
          <Input
            id="view-role"
            value={user.role}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div>
          <label htmlFor="view-verified" className="text-muted-foreground mb-1 block text-sm font-medium">
            Email verified
          </label>
          <Input
            id="view-verified"
            value={user.emailVerified ? 'Yes' : 'No'}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
        <div>
          <label htmlFor="view-joined" className="text-muted-foreground mb-1 block text-sm font-medium">
            Joined
          </label>
          <Input
            id="view-joined"
            value={joinedDate}
            readOnly
            disabled
            className="bg-muted/50"
          />
        </div>
      </div>
    </div>
  )
}
