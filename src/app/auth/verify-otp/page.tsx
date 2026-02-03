'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api-errors'
import { setTokens } from '@/lib/auth'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type VerifyOtpFormData = {
  email: string
  code: string
}

const verifyOtpMutationFn = async (data: VerifyOtpFormData) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const response = await fetch(`${baseUrl}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: data.email, code: data.code }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, 'Verification failed'))
  }
  return result
}

const RESEND_COOLDOWN_SECONDS = 60

export class ResendCooldownError extends Error {
  canResendIn: number
  constructor(message: string, canResendIn: number) {
    super(message)
    this.name = 'ResendCooldownError'
    this.canResendIn = canResendIn
  }
}

const resendOtpPurpose = (purpose: string) =>
  purpose === 'reset_password' ? 'password_reset' : 'email_verification'

const resendOtpMutationFn = async (params: { email: string; purpose: string }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const response = await fetch(`${baseUrl}/auth/resend-otp`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      purpose: resendOtpPurpose(params.purpose),
    }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 409) {
      const canResendIn =
        typeof (result as { canResendIn?: number }).canResendIn === 'number'
          ? (result as { canResendIn: number }).canResendIn
          : RESEND_COOLDOWN_SECONDS
      throw new ResendCooldownError(
        getApiErrorMessage(result, 'Please wait before requesting a new OTP'),
        canResendIn
      )
    }
    throw new Error(getApiErrorMessage(result, 'Resend failed'))
  }
  return result
}

function getTokensFromVerifyResult(result: Record<string, unknown>): {
  accessToken: string | null
  refreshToken: string | null
} {
  const accessToken =
    (result as { accessToken?: string }).accessToken ??
    (result as { access_token?: string }).access_token
  const refreshToken =
    (result as { refreshToken?: string }).refreshToken ??
    (result as { refresh_token?: string }).refresh_token
  return {
    accessToken: typeof accessToken === 'string' ? accessToken : null,
    refreshToken: typeof refreshToken === 'string' ? refreshToken : null,
  }
}

const VerifyOtpPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromSignUp = searchParams.get('email') ?? ''
  const purpose = searchParams.get('purpose') ?? 'email_verification' // email_verification | reset_password

  const [formData, setFormData] = useState<VerifyOtpFormData>({
    email: emailFromSignUp,
    code: '',
  })
  const [resendCooldown, setResendCooldown] = useState(0)
  const [lastErrorType, setLastErrorType] = useState<'expired' | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtpMutationFn,
    onSuccess: (result, variables) => {
      if (purpose === 'reset_password') {
        toast.success('OTP verified. Set your new password.')
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(variables.email)}&code=${encodeURIComponent(variables.code)}`
        )
      } else {
        const { accessToken, refreshToken } = getTokensFromVerifyResult(
          result as Record<string, unknown>
        )
        if (accessToken && refreshToken) setTokens(accessToken, refreshToken)
        toast.success('Email verified successfully')
        router.push('/dashboard')
      }
    },
    onError: (error: Error) => {
      const msg = error.message.toLowerCase()
      if (msg.includes('expired') || msg.includes('invalid')) {
        setLastErrorType('expired')
        toast.error('Your OTP has expired. Click Resend below to get a new code.')
      } else {
        setLastErrorType(null)
        toast.error(error.message)
      }
    },
  })

  const resendOtpMutation = useMutation({
    mutationFn: resendOtpMutationFn,
    onSuccess: (result) => {
      toast.success('OTP sent to your email')
      const r = result as { canResendIn?: number; expiresIn?: number }
      setResendCooldown(
        typeof r?.canResendIn === 'number'
          ? r.canResendIn
          : typeof r?.expiresIn === 'number'
            ? Math.min(r.expiresIn, RESEND_COOLDOWN_SECONDS)
            : RESEND_COOLDOWN_SECONDS
      )
      setLastErrorType(null)
    },
    onError: (error: Error) => {
      if (error instanceof ResendCooldownError) {
        setResendCooldown(error.canResendIn)
        toast.error(error.message)
        return
      }
      toast.error(error.message)
    },
  })

  const handleResend = () => {
    if (!formData.email || resendCooldown > 0) return
    resendOtpMutation.mutate({ email: formData.email, purpose })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    verifyOtpMutation.mutate(formData)
  }

  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col gap-2 my-5">
            <h1 className='h3'>Verify OTP</h1>
            <p className="p1 text-center">Enter the 6-digit code we sent to your email</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              maxLength={6}
              placeholder='000000'
              className='text-center text-2xl tracking-[0.5em] font-mono'
              value={formData.code}
              onChange={(e) => {
                setLastErrorType(null)
                setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }}
              required
            />
            <Button
              type="submit"
              className='w-full mt-4'
              disabled={verifyOtpMutation.isPending || !formData.email}
            >
              Verify
            </Button>
            {lastErrorType === 'expired' && (
              <p className="p1 text-center text-cs-text/80">
                Code expired? Click Resend below to get a new code.
              </p>
            )}
          </form>
        </div>
        <p className='p1'>
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={
              !formData.email ||
              resendCooldown > 0 ||
              resendOtpMutation.isPending
            }
            className="link-highlight !text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default VerifyOtpPage
