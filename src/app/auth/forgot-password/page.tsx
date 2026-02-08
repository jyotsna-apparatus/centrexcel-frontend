'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forgotPassword } from '@/lib/auth-api'
import { validateEmail } from '@/lib/validate'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const ForgotPasswordPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const forgotMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success('If that email is registered, a password reset code has been sent.')
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Request failed')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEmailError(null)
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message ?? 'Invalid email')
      toast.error(emailValidation.message ?? 'Please enter a valid email')
      return
    }
    forgotMutation.mutate(email)
  }

  return (
    <div className="parent h-dvh">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className="h3">Forgot password</h1>
            <p className="p1 text-center">
              Enter your email and we&apos;ll send you an OTP to reset your password
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
              }}
              required
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
            <Button type="submit" className="w-full mt-4" disabled={forgotMutation.isPending}>
              {forgotMutation.isPending ? 'Sending…' : 'Send OTP'}
            </Button>
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

export default ForgotPasswordPage
