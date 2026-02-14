'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { RedirectIfAuthenticated } from '@/components/redirect-if-authenticated'
import { register, checkUsername, type RegisterCredentials } from '@/lib/auth-api'
import { validateEmail, validatePassword, validatePhone, validateUsername } from '@/lib/validate'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { Gift, Gavel, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const USERNAME_DEBOUNCE_MS = 500

const ROLES: { value: RegisterCredentials['role']; label: string; icon: typeof Gift }[] = [
  { value: 'sponsor', label: 'Sponsor', icon: Gift },
  { value: 'judge', label: 'Judge', icon: Gavel },
  { value: 'participant', label: 'Participant', icon: User },
]

type SignUpFormData = {
  name: string
  email: string
  phoneNumber: string
  role: RegisterCredentials['role'] | ''
  password: string
  confirmPassword: string
}

const formDataDefault: SignUpFormData = {
  name: '',
  email: '',
  phoneNumber: '',
  role: '',
  password: '',
  confirmPassword: '',
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

const SignUpPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpFormData>({ ...formDataDefault })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveUsername =
    formData.name.trim().length >= 3
      ? formData.name.trim()
      : formData.email.includes('@')
        ? formData.email.split('@')[0]
        : ''

  useEffect(() => {
    if (effectiveUsername.length < 3) {
      setUsernameStatus('idle')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      checkUsername(effectiveUsername)
        .then((res) => {
          setUsernameStatus(res.data?.available ? 'available' : 'taken')
        })
        .catch(() => {
          setUsernameStatus('idle')
        })
    }, USERNAME_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [effectiveUsername])

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data, variables) => {
      const msg = data.data?.message ?? data.message ?? 'Registration successful. Please check your email for the verification code.'
      toast.success(msg)
      router.push(`/auth/verify-otp?email=${encodeURIComponent(variables.email)}`)
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Registration failed')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    if (!formData.role || !ROLES.some((r) => r.value === formData.role)) {
      errors.role = 'Please select a role'
    }

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.message ?? 'Invalid email'
    }

    const username =
      formData.name.trim().length >= 3 ? formData.name.trim() : formData.email.split('@')[0]
    if (username.length >= 3) {
      const usernameValidation = validateUsername(username)
      if (!usernameValidation.valid) {
        errors.name = usernameValidation.message ?? 'Invalid username'
      }
      if (usernameStatus === 'taken') {
        errors.name = 'This username is already taken'
      }
    }

    if (formData.phoneNumber.trim()) {
      const phoneValidation = validatePhone(formData.phoneNumber)
      if (!phoneValidation.valid) {
        errors.mobile = phoneValidation.message ?? 'Invalid phone number'
      }
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message ?? 'Invalid password'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }

    setFieldErrors({})
    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      role: formData.role as RegisterCredentials['role'],
      ...(username && username.length >= 3 ? { username } : {}),
      ...(formData.phoneNumber.trim() ? { phone: formData.phoneNumber.trim() } : {}),
    })
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
            <div className="flex flex-col items-center justify-center gap-4 my-5">
            <h1 className="h3">Sign up</h1>
            <p className="p1 text-center">
              Create an account with your email and choose your role
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-3 gap-2 w-full">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, role: value })
                      setFieldErrors((prev) => {
                        const next = { ...prev }
                        delete next.role
                        return next
                      })
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-md border bg-transparent px-3 py-3 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-cs-primary/50 min-w-0',
                      fieldErrors.role
                        ? 'border-destructive text-cs-text'
                        : formData.role === value
                          ? 'border border-cs-primary bg-cs-primary/10 text-cs-primary'
                          : 'border border-cs-border text-cs-text hover:border-cs-border/80 hover:bg-white/3'
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.role && (
                <p className="text-sm text-destructive">{fieldErrors.role}</p>
              )}
            </div>
            <Input
              type="text"
              placeholder="Full Name (used as username)"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.name
                  return next
                })
              }}
              aria-invalid={!!fieldErrors.name || usernameStatus === 'taken'}
              className={fieldErrors.name || usernameStatus === 'taken' ? 'border-destructive' : ''}
            />
            {usernameStatus === 'checking' && effectiveUsername.length >= 3 && (
              <p className="text-sm text-cs-text/70">Checking username…</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-sm text-green-600 dark:text-green-400">Username is available</p>
            )}
            {usernameStatus === 'taken' && (
              <p className="text-sm text-destructive">This username is already taken</p>
            )}
            {fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.email
                  return next
                })
              }}
              aria-invalid={!!fieldErrors.email}
              className={fieldErrors.email ? 'border-destructive' : ''}
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
            <Input
              type="tel"
              placeholder="Phone Number (e.g. +919876543210)"
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value })
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.mobile
                  return next
                })
              }}
              aria-invalid={!!fieldErrors.mobile}
              className={fieldErrors.mobile ? 'border-destructive' : ''}
            />
            {fieldErrors.mobile && (
              <p className="text-sm text-destructive">{fieldErrors.mobile}</p>
            )}
            <div>
              <PasswordInput
                placeholder="Password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.password
                    return next
                  })
                }}
                aria-invalid={!!fieldErrors.password}
                className={fieldErrors.password ? 'border-destructive' : ''}
              />
             
              {fieldErrors.password && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.password}</p>
              )}
            </div>
            <div>
              <PasswordInput
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.confirmPassword
                    return next
                  })
                }}
                aria-invalid={!!fieldErrors.confirmPassword}
                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full mt-4" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
          </div>
        <p className="p1">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="link-highlight text-base!">
            Login
          </Link>
        </p>
      </div>
    </div>
    </RedirectIfAuthenticated>
  )
}

export default SignUpPage
