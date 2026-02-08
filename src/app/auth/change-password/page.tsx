'use client'

import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { changePassword } from '@/lib/auth-api'
import { getAccessToken } from '@/lib/auth'
import { validatePassword } from '@/lib/validate-password'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type ChangePasswordFormData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const ChangePasswordPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getAccessToken()) {
      router.replace('/auth/login')
      return
    }
    setIsCheckingAuth(false)
  }, [router])

  const changeMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed successfully.')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to change password')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    const validation = validatePassword(formData.newPassword)
    if (!validation.valid) {
      setPasswordError(validation.message ?? 'Invalid password')
      toast.error(validation.message)
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    changeMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    })
  }

  if (isCheckingAuth) {
    return (
      <div className="parent h-dvh flex items-center justify-center">
        <p className="p1 text-cs-text">Loading...</p>
      </div>
    )
  }

  return (
    <div className="parent h-dvh">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className="h3">Change password</h1>
            <p className="p1 text-center">
              Enter your current password and choose a new one
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <PasswordInput
              placeholder="Current password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              required
            />
            <PasswordInput
              placeholder="New password"
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value })
                setPasswordError(null)
              }}
              required
            />
            <p className="text-xs text-cs-text/70 mt-1">
              At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol
            </p>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <PasswordInput
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={changeMutation.isPending}
            >
              {changeMutation.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>
        <p className="p1">
          <Link href="/dashboard" className="link-highlight text-base!">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ChangePasswordPage
