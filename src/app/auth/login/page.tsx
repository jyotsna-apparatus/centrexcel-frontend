'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { setTokens } from '@/lib/auth'
import { login } from '@/lib/auth-api'
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

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [emailError, setEmailError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens(data.data.accessToken, data.data.refreshToken)
      toast.success(data.message ?? 'Login successful')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Login failed')
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
    loginMutation.mutate({ email: formData.email, password: formData.password })
  }

  return (
    <div className="parent h-dvh">
      <div className="container flex flex-col gap-4 items-center justify-center">
        <div className="card flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 my-5">
            <h1 className="h3">Login</h1>
            <p className="p1">Enter your email and password to login</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <Input
              type="email"
              placeholder="Email"
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
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Link href="/auth/forgot-password" className="link-highlight w-full pl-3">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in…' : 'Login'}
            </Button>
          </form>
        </div>
        <p className="p1">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="link-highlight text-base!">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
