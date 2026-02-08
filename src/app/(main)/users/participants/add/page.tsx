'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import PageHeader from '@/components/pageHeader/PageHeader'
import { createUser, checkUsername, type RegisterCredentials } from '@/lib/auth-api'
import { validateEmail, validatePassword, validateUsername } from '@/lib/validate'
import { toast } from 'sonner'

const USERNAME_DEBOUNCE_MS = 500

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

export default function AddParticipantPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      setUsernameStatus('idle')
      return
    }
    const userRes = validateUsername(trimmed)
    if (!userRes.valid) {
      setUsernameStatus('idle')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      checkUsername(trimmed)
        .then((res) => {
          setUsernameStatus(res.data?.available ? 'available' : 'taken')
        })
        .catch(() => {
          setUsernameStatus('idle')
        })
    }, USERNAME_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [username])

  const mutation = useMutation({
    mutationFn: (creds: RegisterCredentials) => createUser(creds),
    onSuccess: () => {
      toast.success('Participant created successfully.')
      router.push('/users/participants')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create participant')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const emailRes = validateEmail(email)
    if (!emailRes.valid) next.email = emailRes.message ?? 'Invalid email'
    if (username.trim()) {
      const userRes = validateUsername(username.trim())
      if (!userRes.valid) next.username = userRes.message ?? 'Invalid username'
      if (usernameStatus === 'taken') next.username = 'This username is already taken'
    }
    const pwRes = validatePassword(password)
    if (!pwRes.valid) next.password = pwRes.message ?? 'Invalid password'
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    mutation.mutate({
      email: email.trim(),
      password,
      role: 'participant',
      ...(username.trim() ? { username: username.trim() } : {}),
    })
  }

  return (
    <div>
      <PageHeader
        title="Add Participant"
        description="Create a new participant account."
      >
        <Button variant="outline" asChild>
          <Link href="/users/participants">Back to list</Link>
        </Button>
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
            placeholder="participant@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="username" className="text-muted-foreground mb-1 block text-sm font-medium">
            Username (optional)
          </label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="participant1"
            autoComplete="username"
            aria-invalid={!!errors.username || usernameStatus === 'taken'}
            className={errors.username || usernameStatus === 'taken' ? 'border-destructive' : ''}
          />
          {usernameStatus === 'checking' && username.trim().length >= 3 && (
            <p className="text-muted-foreground mt-1 text-sm">Checking username...</p>
          )}
          {usernameStatus === 'available' && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400">Username is available</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="mt-1 text-sm text-destructive">This username is already taken</p>
          )}
          {errors.username && usernameStatus !== 'taken' && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="text-muted-foreground mb-1 block text-sm font-medium">
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-muted-foreground mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending || usernameStatus === 'checking' || usernameStatus === 'taken'}>
            {mutation.isPending ? 'Creating...' : 'Create participant'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/users/participants">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
