'use client'

import { getAccessToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.replace('/auth/login')
      return
    }
    setHasToken(true)
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return (
      <div className="flex w-full h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="text-cs-text p1">Loading...</div>
      </div>
    )
  }

  if (!hasToken) return null

  return <>{children}</>
}
