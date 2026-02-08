'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/pageHeader/PageHeader'
import { getUser, updateUser, type UpdateUserBody } from '@/lib/auth-api'
import { validateEmail, validateUsername } from '@/lib/validate'
import { toast } from 'sonner'

export default function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['sponsor', id],
    queryFn: () => getUser(id),
  })

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setUsername(user.username ?? '')
      setEmailVerified(user.emailVerified)
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (body: UpdateUserBody) => updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor', id] })
      queryClient.invalidateQueries({ queryKey: ['sponsors'] })
      toast.success('Sponsor updated.')
      router.push(`/users/sponsors/${id}`)
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to update sponsor')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const emailRes = validateEmail(email.trim())
    if (!emailRes.valid) next.email = emailRes.message ?? 'Invalid email'
    if (username.trim()) {
      const userRes = validateUsername(username.trim())
      if (!userRes.valid) next.username = userRes.message ?? 'Invalid username'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    mutation.mutate({
      email: email.trim(),
      username: username.trim() || null,
      emailVerified,
    })
  }

  if (isLoading || (!user && !isError)) {
    return (
      <div>
        <PageHeader title="Edit Sponsor" description="Update sponsor details." />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isError || !user) {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load sponsor')
    }
    return (
      <div>
        <PageHeader title="Edit Sponsor" description="Update sponsor details." />
        <Button variant="outline" asChild className="mt-4">
          <Link href="/users/sponsors">Back to list</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Edit Sponsor" description="Update sponsor details.">
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/users/sponsors/${id}`}>Cancel</Link>
          </Button>
        </div>
      </PageHeader>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
        <div>
          <label htmlFor="email" className="text-muted-foreground mb-1 block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sponsor@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="username" className="text-muted-foreground mb-1 block text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="sponsor1"
            autoComplete="username"
            aria-invalid={!!errors.username}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emailVerified"
            checked={emailVerified}
            onChange={(e) => setEmailVerified(e.target.checked)}
            className="h-4 w-4 rounded border-cs-border"
          />
          <label htmlFor="emailVerified" className="text-sm font-medium">
            Email verified
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/users/sponsors/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
