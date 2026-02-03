'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api-errors'
import { validateEmail, validatePassword, validatePhone } from '@/lib/validate'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { Gift, Scale, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const ROLES = [
  { value: 'sponsor', label: 'Sponsor', icon: Gift },
  { value: 'judge', label: 'Judge', icon: Scale },
  { value: 'participant', label: 'Participant', icon: User },
] as const

type RoleValue = (typeof ROLES)[number]['value']

type SignUpFormData = {
  name: string
  email: string
  phoneNumber: string
  role: string
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

const signUpMutationFn = async (data: SignUpFormData) => {
  if (data.password !== data.confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message ?? 'Invalid password')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL
  if (!baseUrl) throw new Error('Backend URL is not configured')

  const payload = {
    name: data.name,
    email: data.email,
    mobile: data.phoneNumber || undefined,
    role: data.role === 'judge' ? 'organizer' : data.role,
    password: data.password,
  }

  const response = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Role not allowed for self-signup')
    }
    if (response.status === 409) {
      throw new Error('User already exists')
    }
    const message = getApiErrorMessage(result, 'Sign up failed')
    const err = new Error(message) as Error & { result?: unknown }
    err.result = result
    throw err
  }
  return result
}

const SignUpPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({ ...formDataDefault })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const signUpMutation = useMutation({
    mutationFn: signUpMutationFn,
    onSuccess: (_, variables) => {
      toast.success('OTP sent to your email')
      router.push(`/auth/verify-otp?email=${encodeURIComponent(variables.email)}`)
    },
    onError: (error: Error & { result?: unknown }) => {
      const errors = error.result != null ? getApiFieldErrors(error.result) : {}
      setFieldErrors(errors)
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errors: Record<string, string> = {}

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.message ?? 'Invalid email'
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
    signUpMutation.mutate(formData)
  }








  return (
    <div className='parent h-[100dvh]'>
      <div className='container flex flex-col gap-4 items-center justify-center'>
        <div className='card flex flex-col gap-4 items-center justify-center'>
          <div className="flex flex-col items-center justify-center gap-4 my-5">
            <h1 className='h3'>Sign up</h1>
            <p className="p1 text-center">Create an account with your email and choose your role</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 w-full">
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: value })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-md border border-cs-border bg-transparent px-3 py-3 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-cs-primary/50',
                      formData.role === value
                        ? 'border-cs-primary bg-cs-primary/10 text-cs-primary'
                        : 'text-cs-text hover:border-cs-border/80 hover:bg-white/5'
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Input type='text' placeholder='Full Name' value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }} aria-invalid={!!fieldErrors.name} />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            <Input type='email' placeholder='Email' value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; }); }} aria-invalid={!!fieldErrors.email} />
            {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
            <Input type='tel' placeholder='Phone Number (e.g. +919876543210)' value={formData.phoneNumber} onChange={(e) => { setFormData({ ...formData, phoneNumber: e.target.value }); setFieldErrors((prev) => { const next = { ...prev }; delete next.mobile; return next; }); }} aria-invalid={!!fieldErrors.mobile} />
            {fieldErrors.mobile && <p className="text-sm text-destructive">{fieldErrors.mobile}</p>}
            <div>
              <PasswordInput placeholder='Password' value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors((prev) => { const next = { ...prev }; delete next.password; return next; }); }} aria-invalid={!!fieldErrors.password} />
              <p className="text-xs text-cs-text/70 mt-1">At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol</p>
              {fieldErrors.password && <p className="text-sm text-destructive mt-1">{fieldErrors.password}</p>}
            </div>
            <div>
              <PasswordInput placeholder='Confirm password' value={formData.confirmPassword} onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setFieldErrors((prev) => { const next = { ...prev }; delete next.confirmPassword; return next; }); }} aria-invalid={!!fieldErrors.confirmPassword} />
              {fieldErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{fieldErrors.confirmPassword}</p>}
            </div>
            <Button type="submit" className='w-full mt-4' disabled={signUpMutation.isPending}>
              Sign up
            </Button>
          </form>
        </div>
        <p className='p1'>Already have an account? <Link href='/auth/login' className='link-highlight !text-base'>Login</Link></p>
      </div>
    </div>
  )
}

export default SignUpPage
