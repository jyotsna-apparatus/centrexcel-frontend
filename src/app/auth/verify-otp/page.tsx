'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RedirectIfAuthenticated } from '@/components/redirect-if-authenticated'
import { setTokens } from '@/lib/auth'
import { resendOtp, verifyEmail } from '@/lib/auth-api'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

const OTP_LENGTH = 6

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
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0)

  const setCodeFromDigits = useCallback((newDigits: string[]) => {
    const code = newDigits.join('')
    setFormData((prev) => ({ ...prev, code }))
  }, [])

  const setDigit = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1)
      setDigits((prev) => {
        const next = [...prev]
        next[index] = digit
        setCodeFromDigits(next)
        return next
      })
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [setCodeFromDigits]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
      if (!pasted) return
      const newDigits = Array(OTP_LENGTH).fill('')
      pasted.split('').forEach((char, i) => {
        if (i < OTP_LENGTH) newDigits[i] = char
      })
      setDigits(newDigits)
      setCodeFromDigits(newDigits)
      const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1)
      inputRefs.current[nextFocus]?.focus()
    },
    [setCodeFromDigits]
  )

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
      <RedirectIfAuthenticated>
        <div className="parent h-dvh flex items-center justify-center">
          <p className="p1 text-cs-text">Redirecting to reset password…</p>
        </div>
      </RedirectIfAuthenticated>
    )
  }

  return (
    <RedirectIfAuthenticated>
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
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  placeholder=""
                  aria-label={`Digit ${i + 1}`}
                  value={digits[i]}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    'w-11 h-12 text-center text-2xl font-mono p-0',
                    'focus-visible:ring-2 focus-visible:ring-cs-primary'
                  )}
                />
              ))}
            </div>
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
    </RedirectIfAuthenticated>
  )
}

export default VerifyOtpPage
