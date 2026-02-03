'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { getApiErrorMessage } from '@/lib/api-errors'
import { setTokens } from '@/lib/auth'
import { validateEmail } from '@/lib/validate'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type LoginFormData = {
  email: string
  password: string
}

export class EmailNotVerifiedError extends Error {
  email: string
  constructor(message: string, email: string) {
    super(message)
    this.name = 'EmailNotVerifiedError'
    this.email = email
  }
}

const loginMutationFn = async (data: LoginFormData) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: data.email, password: data.password }),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403 && result?.message?.toLowerCase().includes('email not verified')) {
      throw new EmailNotVerifiedError(
        typeof result?.message === 'string' ? result.message : 'Email not verified. OTP sent to your email.',
        data.email
      )
    }
    throw new Error(getApiErrorMessage(result, 'Login failed'))
  }
  return result
}

function getTokensFromResponse(result: Record<string, unknown>): {
  accessToken: string | null
  refreshToken: string | null
} {
  const accessToken =
    (result as { accessToken?: string }).accessToken ??
    (result as { access_token?: string }).access_token ??
    (result as { token?: string }).token
  const refreshToken =
    (result as { refreshToken?: string }).refreshToken ??
    (result as { refresh_token?: string }).refresh_token
  return {
    accessToken: typeof accessToken === 'string' ? accessToken : null,
    refreshToken: typeof refreshToken === 'string' ? refreshToken : null,
  }
}

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'p@gmail.com',
    password: 'Test@123',
  })
  const [emailError, setEmailError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: (result) => {
      const { accessToken, refreshToken } = getTokensFromResponse(
        result as Record<string, unknown>
      )
      if (accessToken && refreshToken) setTokens(accessToken, refreshToken)
      toast.success('Logged in successfully')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      if (error instanceof EmailNotVerifiedError) {
        toast.info(error.message)
        router.push(`/auth/verify-otp?email=${encodeURIComponent(error.email)}`)
        return
      }
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEmailError(null)
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message ?? 'Invalid email')
      toast.error(emailValidation.message ?? 'Please enter a valid email')
      return
    }
    loginMutation.mutate(formData)
  }

  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className='h3'>Login</h1>
            <p className="p1">Enter your email and password to login</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type='email'
              placeholder='Email'
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setEmailError(null)
              }}
              required
              aria-invalid={!!emailError}
            />
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            <div className="flex flex-col gap-1 w-full">
              <PasswordInput
                placeholder='Password'
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Link href='/auth/forgot-password' className='link-highlight w-full pl-3'>
                Forgot Password?
              </Link>
            </div>
            <Button
              type="submit"
              className='w-full mt-4'
              disabled={loginMutation.isPending}
            >
              Login
            </Button>
          </form>
        </div>
        <p className='p1'>
          Don&apos;t have an account?{' '}
          <Link href='/auth/sign-up' className='link-highlight !text-base'>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
