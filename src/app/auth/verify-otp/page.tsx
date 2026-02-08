'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setTokens } from '@/lib/auth'
import { resendOtp, verifyEmail } from '@/lib/auth-api'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

type VerifyOtpFormData = {
  email: string
  code: string
}

const VerifyOtpPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromSignUp = searchParams.get('email') ?? ''
  const purpose = searchParams.get('purpose') ?? 'email_verification'

  const [formData, setFormData] = useState<VerifyOtpFormData>({
    email: emailFromSignUp,
    code: '',
  })
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)

  useEffect(() => {
    if (purpose === 'reset_password') {
      router.replace(
        `/auth/reset-password${emailFromSignUp ? `?email=${encodeURIComponent(emailFromSignUp)}` : ''}`
      )
    }
  }, [purpose, emailFromSignUp, router])

  useEffect(() => {
    if (resendCooldownSeconds <= 0) return
    const id = setInterval(() => setResendCooldownSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldownSeconds])

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: (data) => {
      setResendCooldownSeconds(60)
      toast.success(data.message ?? 'Verification code sent.')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to resend code')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      if (data.data?.accessToken && data.data?.refreshToken) {
        setTokens(data.data.accessToken, data.data.refreshToken)
        toast.success(data.message ?? 'Email verified. Welcome!')
        router.push('/dashboard')
      } else {
        toast.success(data.message ?? 'Email verified. You can now log in.')
        router.push('/auth/login')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Verification failed')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    verifyMutation.mutate({
      email: formData.email,
      otp: formData.code,
    })
  }

  if (purpose === 'reset_password') {
    return (
      <div className="parent h-dvh flex items-center justify-center">
        <p className="p1 text-cs-text">Redirecting to reset password…</p>
      </div>
    )
  }

  return (
    <div className="parent h-dvh">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col gap-2 my-5">
            <h1 className="h3">Verify OTP</h1>
            <p className="p1 text-center">
              Enter the 6-digit code we sent to your email
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.replace(/\D/g, '').slice(0, 6),
                })
              }
              required
            />
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={verifyMutation.isPending || !formData.email || !formData.code.trim()}
            >
              {verifyMutation.isPending ? 'Verifying…' : 'Verify'}
            </Button>
            {formData.email && (
              <button
                type="button"
                onClick={() =>
                  resendMutation.mutate({ email: formData.email, type: 'registration' })
                }
                disabled={resendMutation.isPending || resendCooldownSeconds > 0}
                className="link-highlight text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendMutation.isPending
                  ? 'Sending…'
                  : resendCooldownSeconds > 0
                    ? `Resend code in ${resendCooldownSeconds}s`
                    : 'Resend code'}
              </button>
            )}
          </form>
        </div>
        <p className="p1">
          <Link href="/auth/login" className="link-highlight text-base!">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyOtpPage
