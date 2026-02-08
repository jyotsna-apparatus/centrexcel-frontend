'use client'

import { getAccessToken, clearTokens } from '@/lib/auth'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { loadUser } = useAuth()
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  useEffect(() => {
    let cancelled = false

    async function validateAuth() {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) {
          setAuthState('unauthenticated')
          router.replace('/auth/login')
        }
        return
      }

      try {
        const user = await loadUser()
        if (!cancelled && user) setAuthState('authenticated')
        else if (!cancelled) {
          clearTokens()
          setAuthState('unauthenticated')
          router.replace('/auth/login')
        }
      } catch {
        if (!cancelled) {
          clearTokens()
          setAuthState('unauthenticated')
          router.replace('/auth/login')
        }
      }
    }

    validateAuth()
    return () => {
      cancelled = true
    }
  }, [router, loadUser])

  if (authState === 'checking') {
    return (
      <div className="flex w-full h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="text-cs-text p1">Loading...</div>
      </div>
    )
  }

  if (authState !== 'authenticated') return null

  return <>{children}</>
}
