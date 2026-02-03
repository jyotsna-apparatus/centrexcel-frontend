'use client'

import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { getApiErrorMessage } from '@/lib/api-errors'
import { validatePassword } from '@/lib/validate-password'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type ResetPasswordFormData = {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

const resetPasswordMutationFn = async (data: ResetPasswordFormData) => {
  if (data.newPassword !== data.confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const validation = validatePassword(data.newPassword)
  if (!validation.valid) {
    throw new Error(validation.message ?? 'Invalid password')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const response = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      code: data.code,
      newPassword: data.newPassword,
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, 'Failed to reset password'))
  }
  return result
}

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const code = searchParams.get('code') ?? ''

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email,
    code,
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [otpExpiredHint, setOtpExpiredHint] = useState(false)

  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordMutationFn,
    onSuccess: () => {
      toast.success('Password reset successfully')
      router.push('/auth/login')
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase()
      if (msg.includes('expired') || (msg.includes('invalid') && msg.includes('otp'))) {
        setOtpExpiredHint(true)
      }
      toast.error(error.message)
    },
  })

  const verifyOtpResendUrl = formData.email
    ? `/auth/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=reset_password`
    : null

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
      toast.error('Passwords do not match')
      return
    }
    resetPasswordMutation.mutate(formData)
  }

  const canSubmit = formData.email && formData.code

  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col gap-2 my-5">
            <h1 className='h3'>Reset password</h1>
            <p className="p1 text-center">Enter your new password below</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <PasswordInput
              placeholder='New password'
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
              placeholder='Confirm password'
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              className='w-full mt-4'
              disabled={resetPasswordMutation.isPending || !canSubmit}
            >
              Update password
            </Button>
            {otpExpiredHint && (
              <p className="p1 text-center text-cs-text/90 mt-2">
                Code expired?{' '}
                <Link
                  href={verifyOtpResendUrl ?? '#'}
                  className="link-highlight !text-base"
                  onClick={(e) => !verifyOtpResendUrl && e.preventDefault()}
                >
                  Get a new code
                </Link>
              </p>
            )}
          </form>
        </div>
        {verifyOtpResendUrl && (
          <p className='p1'>
            Code expired or didn&apos;t receive it?{' '}
            <Link href={verifyOtpResendUrl} className='link-highlight !text-base'>
              Resend OTP
            </Link>
          </p>
        )}
        <p className='p1'>
          <Link href='/auth/login' className='link-highlight !text-base'>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
