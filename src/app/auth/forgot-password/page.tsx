'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api-errors'
import { validateEmail } from '@/lib/validate'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const forgotPasswordMutationFn = async (email: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const response = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, 'Failed to send reset link'))
  }
  return result
}

const ForgotPasswordPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordMutationFn,
    onSuccess: (_, submittedEmail) => {
      toast.success('OTP sent to your email')
      router.push(`/auth/verify-otp?email=${encodeURIComponent(submittedEmail)}&purpose=reset_password`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
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
    forgotPasswordMutation.mutate(email)
  }

  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className='h3'>Forgot password</h1>
            <p className="p1 text-center">
              Enter your email and we&apos;ll send you an OTP to reset your password
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type='email'
              placeholder='Email'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError(null)
              }}
              required
              aria-invalid={!!emailError}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            <Button
              type="submit"
              className='w-full mt-4'
              disabled={forgotPasswordMutation.isPending}
            >
              Send reset link
            </Button>
          </form>
        </div>
        <p className='p1'>
          Remember your password?{' '}
          <Link href='/auth/login' className='link-highlight !text-base'>
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
