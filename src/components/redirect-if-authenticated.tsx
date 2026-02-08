'use client'

import { getAccessToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Redirects to /dashboard if the user already has an access token.
 * Use on login, sign-up, forgot-password, verify-otp so logged-in users don't see auth forms.
 */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      router.replace('/dashboard')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="flex w-full min-h-[50vh] items-center justify-center">
        <div className="text-cs-text p1">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
