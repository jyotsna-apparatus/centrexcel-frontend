'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { acceptInvite } from '@/lib/api'
import { setTokens } from '@/lib/auth'
import { validatePassword } from '@/lib/validate-password'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [organization, setOrganization] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptInvite({
        token,
        name: name.trim(),
        password,
        organization: organization.trim() || undefined,
      }),
    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken) {
        setTokens(data.accessToken, data.refreshToken)
        toast.success('Invitation accepted. You are now logged in.')
        router.push('/judge')
      } else {
        toast.success('Invitation accepted.')
        router.push('/auth/login')
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    const validation = validatePassword(password)
    if (!validation.valid) {
      setPasswordError(validation.message ?? 'Invalid password')
      toast.error(validation.message)
      return
    }
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    acceptMutation.mutate()
  }

  if (!token) {
    return (
      <div className="parent h-[100dvh]">
        <div className="container flex flex-col gap-4 items-center justify-center">
          <div className="card flex flex-col gap-4">
            <h1 className="h3">Invalid invitation</h1>
            <p className="p1 text-cs-text">This invitation link is invalid or has expired.</p>
            <Link href="/auth/login" className="link-highlight">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="parent h-[100dvh]">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 w-full max-w-md">
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className="h3">Accept invitation</h1>
            <p className="p1 text-center text-cs-text">
              You have been invited as a judge. Set your name and password to create your account.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-cs-heading">
                Full name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-cs-heading">
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-cs-text/70 mt-1">
                At least 8 characters, 1 uppercase, 1 lowercase, 1 number
              </p>
              {passwordError && (
                <p className="text-sm text-destructive mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <label htmlFor="org" className="mb-1 block text-sm font-medium text-cs-heading">
                Organization (optional)
              </label>
              <Input
                id="org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. MIT"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={acceptMutation.isPending}
            >
              Accept & create account
            </Button>
          </form>
        </div>
        <p className="p1">
          <Link href="/auth/login" className="link-highlight !text-base">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
