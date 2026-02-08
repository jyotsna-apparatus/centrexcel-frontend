'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
  resendResetOtp,
  resetPassword,
  verifyResetOtp,
} from '@/lib/auth-api'
import { validatePassword } from '@/lib/validate-password'
import { useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const RESET_TOKEN_KEY = 'auth_reset_token'

type Step1Data = { email: string; code: string }
type Step2Data = { newPassword: string; confirmPassword: string }

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') ?? ''

  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<Step1Data>({
    email: emailParam,
    code: '',
  })
  const [step2, setStep2] = useState<Step2Data>({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)

  useEffect(() => {
    if (resendCooldownSeconds <= 0) return
    const id = setInterval(() => setResendCooldownSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCooldownSeconds])

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return
    if (sessionStorage.getItem(RESET_TOKEN_KEY)) setStep(2)
  }, [])

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyResetOtp(email, otp),
    onSuccess: (data) => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(RESET_TOKEN_KEY, data.data.resetToken)
      }
      toast.success(data.data.message ?? 'Code verified. Set your new password.')
      setStep(2)
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Invalid or expired code')
    },
  })

  const resetMutation = useMutation({
    mutationFn: (payload: { resetToken: string; newPassword: string }) =>
      resetPassword(payload),
    onSuccess: () => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(RESET_TOKEN_KEY)
      }
      toast.success('Password reset successfully. You can log in now.')
      router.push('/auth/login')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Reset failed')
    },
  })

  const resendMutation = useMutation({
    mutationFn: resendResetOtp,
    onSuccess: () => {
      setResendCooldownSeconds(60)
      toast.success('A new code has been sent to your email.')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to resend code')
    },
  })

  const handleStep1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!step1.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (step1.code.trim().length !== 6) {
      toast.error('Please enter the 6-digit code from your email')
      return
    }
    verifyOtpMutation.mutate({ email: step1.email.trim(), otp: step1.code.trim() })
  }

  const handleStep2 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    const validation = validatePassword(step2.newPassword)
    if (!validation.valid) {
      setPasswordError(validation.message ?? 'Invalid password')
      toast.error(validation.message)
      return
    }
    if (step2.newPassword !== step2.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    const resetToken =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(RESET_TOKEN_KEY) : null
    if (!resetToken) {
      toast.error('Session expired. Please request a new code from the forgot password page.')
      setStep(1)
      return
    }
    resetMutation.mutate({ resetToken, newPassword: step2.newPassword })
  }

  return (
    <div className="parent h-dvh">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 items-center justify-center">
          <Image
            src="/logo-full.svg"
            alt="Centrexcel"
            width={200}
            height={39}
            className="h-9 w-auto"
            priority
          />
          <div className="flex flex-col gap-2 my-5">
            <h1 className="h3">Reset password</h1>
            <p className="p1 text-center">
              {step === 1
                ? 'Enter the 6-digit code we sent to your email'
                : 'Enter your new password below'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="flex flex-col gap-4 w-full">
              <Input
                type="email"
                placeholder="Email"
                value={step1.email}
                onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                required
              />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6-digit code"
                className="text-center tracking-[0.25em] font-mono"
                value={step1.code}
                onChange={(e) =>
                  setStep1({
                    ...step1,
                    code: e.target.value.replace(/\D/g, '').slice(0, 6),
                  })
                }
              />
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify code'}
              </Button>
              {step1.email && (
                <button
                  type="button"
                  onClick={() => resendMutation.mutate(step1.email)}
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
          ) : (
            <form onSubmit={handleStep2} className="flex flex-col gap-4 w-full">
              <PasswordInput
                placeholder="New password"
                value={step2.newPassword}
                onChange={(e) => {
                  setStep2({ ...step2, newPassword: e.target.value })
                  setPasswordError(null)
                }}
                required
              />
             
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <PasswordInput
                placeholder="Confirm password"
                value={step2.confirmPassword}
                onChange={(e) =>
                  setStep2({ ...step2, confirmPassword: e.target.value })
                }
                required
              />
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Updating…' : 'Update password'}
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="link-highlight text-sm mt-2"
              >
                Use a different code
              </button>
            </form>
          )}
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

export default ResetPasswordPage
