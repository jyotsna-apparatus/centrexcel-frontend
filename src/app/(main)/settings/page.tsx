'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
  updateProfile,
  requestEmailChange,
  confirmEmailChange,
  requestPasswordChangeOtp,
  confirmPasswordChange,
} from '@/lib/auth-api'
import { useAuth } from '@/contexts/auth-context'
import { validatePassword, validateUsername } from '@/lib/validate'
import { validateEmail } from '@/lib/validate'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const OTP_LENGTH = 6

export default function SettingsPage() {
  const { user, loadUser } = useAuth()
  const queryClient = useQueryClient()

  // Profile
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [emailStep, setEmailStep] = useState<'form' | 'otp'>('form')
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)

  // Password change
  const [passwordOtpDigits, setPasswordOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordStep, setPasswordStep] = useState<'idle' | 'otp'>('idle')
  const passwordOtpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [passwordResendCooldown, setPasswordResendCooldown] = useState(0)

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setUsername(user.username ?? '')
    }
  }, [user])

  useEffect(() => {
    if (emailResendCooldown <= 0) return
    const id = setInterval(() => setEmailResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [emailResendCooldown])

  useEffect(() => {
    if (passwordResendCooldown <= 0) return
    const id = setInterval(() => setPasswordResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [passwordResendCooldown])

  const setEmailOtpDigit = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setEmailOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) emailOtpRefs.current[index + 1]?.focus()
  }, [])

  const setPasswordOtpDigit = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setPasswordOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) passwordOtpRefs.current[index + 1]?.focus()
  }, [])

  const handleEmailOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const digits = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { if (i < OTP_LENGTH) digits[i] = c })
    setEmailOtpDigits(digits)
    emailOtpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }, [])

  const handlePasswordOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const digits = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { if (i < OTP_LENGTH) digits[i] = c })
    setPasswordOtpDigits(digits)
    passwordOtpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }, [])

  const profileMutation = useMutation({
    mutationFn: (body: { name?: string | null; username?: string | null }) => updateProfile(body),
    onSuccess: async () => {
      await loadUser()
      toast.success('Profile updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const requestEmailMutation = useMutation({
    mutationFn: (email: string) => requestEmailChange(email),
    onSuccess: () => {
      setEmailStep('otp')
      setEmailResendCooldown(60)
      toast.success('Verification code sent to your new email')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const confirmEmailMutation = useMutation({
    mutationFn: (body: { newEmail: string; otp: string }) => confirmEmailChange(body),
    onSuccess: async () => {
      await loadUser()
      setEmailStep('form')
      setNewEmail('')
      setEmailOtpDigits(Array(OTP_LENGTH).fill(''))
      toast.success('Email updated successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const requestPasswordMutation = useMutation({
    mutationFn: () => requestPasswordChangeOtp(),
    onSuccess: () => {
      setPasswordStep('otp')
      setPasswordResendCooldown(60)
      toast.success('Verification code sent to your email')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const confirmPasswordMutation = useMutation({
    mutationFn: (body: { otp: string; newPassword: string }) => confirmPasswordChange(body),
    onSuccess: async () => {
      setPasswordStep('idle')
      setPasswordOtpDigits(Array(OTP_LENGTH).fill(''))
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError(null)
      toast.success('Password changed successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError(null)
    if (username.trim()) {
      const u = validateUsername(username.trim())
      if (!u.valid) {
        setUsernameError(u.message ?? 'Invalid username')
        return
      }
    }
    profileMutation.mutate({
      name: name.trim() || null,
      username: username.trim() || null,
    })
  }

  const onRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault()
    const v = validateEmail(newEmail.trim())
    if (!v.valid) {
      toast.error(v.message)
      return
    }
    requestEmailMutation.mutate(newEmail.trim().toLowerCase())
  }

  const onConfirmEmailChange = (e: React.FormEvent) => {
    e.preventDefault()
    const otp = emailOtpDigits.join('')
    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the 6-digit code')
      return
    }
    confirmEmailMutation.mutate({ newEmail: newEmail.trim().toLowerCase(), otp })
  }

  const onConfirmPasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    const otp = passwordOtpDigits.join('')
    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the 6-digit code')
      return
    }
    const v = validatePassword(newPassword)
    if (!v.valid) {
      setPasswordError(v.message ?? 'Invalid password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    confirmPasswordMutation.mutate({ otp, newPassword })
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <p className="p1 text-cs-text">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="h2 text-cs-heading">Settings</h1>
        <p className="p1 mt-1 text-cs-text">Manage your account details. Email and password changes require OTP verification.</p>
      </header>

      {/* Profile: name & username */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Profile</h2>
        <form onSubmit={onSaveProfile} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-cs-text mb-1.5 block">Name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-md"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-cs-text mb-1.5 block">Username</label>
            <Input
              type="text"
              placeholder="Username (3–30 characters)"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameError(null)
              }}
              className="max-w-md"
              maxLength={30}
            />
            {usernameError && <p className="text-sm text-destructive mt-1">{usernameError}</p>}
          </div>
          <Button type="submit" disabled={profileMutation.isPending}>
            {profileMutation.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </section>

      {/* Email change with OTP */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Email</h2>
        <p className="p1 text-cs-text mb-4">Current email: <strong>{user.email}</strong></p>
        {emailStep === 'form' ? (
          <form onSubmit={onRequestEmailChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">New email</label>
              <Input
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="max-w-md"
                required
              />
            </div>
            <Button type="submit" disabled={requestEmailMutation.isPending}>
              {requestEmailMutation.isPending ? 'Sending code…' : 'Send verification code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={onConfirmEmailChange} className="space-y-4">
            <p className="text-sm text-cs-text">Enter the 6-digit code sent to <strong>{newEmail}</strong></p>
            <div className="flex gap-2 justify-start" onPaste={handleEmailOtpPaste}>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  ref={(el) => { emailOtpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={emailOtpDigits[i]}
                  onChange={(e) => setEmailOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !emailOtpDigits[i] && i > 0) emailOtpRefs.current[i - 1]?.focus()
                  }}
                  className={cn('w-11 h-12 text-center text-xl font-mono p-0')}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={confirmEmailMutation.isPending || emailOtpDigits.join('').length !== OTP_LENGTH}>
                {confirmEmailMutation.isPending ? 'Updating…' : 'Confirm new email'}
              </Button>
              <button
                type="button"
                onClick={() => requestEmailMutation.mutate(newEmail)}
                disabled={requestEmailMutation.isPending || emailResendCooldown > 0}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => { setEmailStep('form'); setNewEmail(''); setEmailOtpDigits(Array(OTP_LENGTH).fill('')) }}
                className="text-sm text-cs-text hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Password change with OTP */}
      <section className="rounded-lg border border-cs-border bg-card p-6">
        <h2 className="h4 text-cs-heading mb-4">Password</h2>
        {passwordStep === 'idle' ? (
          <div>
            <p className="p1 text-cs-text mb-4">We will send a verification code to your email before changing your password.</p>
            <Button onClick={() => requestPasswordMutation.mutate()} disabled={requestPasswordMutation.isPending}>
              {requestPasswordMutation.isPending ? 'Sending…' : 'Send verification code'}
            </Button>
          </div>
        ) : (
          <form onSubmit={onConfirmPasswordChange} className="space-y-4">
            <p className="text-sm text-cs-text">Enter the 6-digit code sent to your email.</p>
            <div className="flex gap-2 justify-start" onPaste={handlePasswordOtpPaste}>
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  ref={(el) => { passwordOtpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={passwordOtpDigits[i]}
                  onChange={(e) => setPasswordOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !passwordOtpDigits[i] && i > 0) passwordOtpRefs.current[i - 1]?.focus()
                  }}
                  className={cn('w-11 h-12 text-center text-xl font-mono p-0')}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">New password</label>
              <PasswordInput
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError(null)
                }}
                className="max-w-md"
              />
              {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-cs-text mb-1.5 block">Confirm new password</label>
              <PasswordInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={
                  confirmPasswordMutation.isPending ||
                  passwordOtpDigits.join('').length !== OTP_LENGTH ||
                  !newPassword ||
                  newPassword !== confirmPassword
                }
              >
                {confirmPasswordMutation.isPending ? 'Updating…' : 'Change password'}
              </Button>
              <button
                type="button"
                onClick={() => requestPasswordMutation.mutate()}
                disabled={requestPasswordMutation.isPending || passwordResendCooldown > 0}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {passwordResendCooldown > 0 ? `Resend in ${passwordResendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordStep('idle')
                  setPasswordOtpDigits(Array(OTP_LENGTH).fill(''))
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-sm text-cs-text hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
