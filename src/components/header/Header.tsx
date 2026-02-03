'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { Button } from '../ui/button'
import { SidebarTrigger } from '../ui/sidebar'

const Header = () => {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/auth/login')
  }

  return (
    <div className="flex items-center justify-between w-full h-16 bg-cs-card border-b border-cs-border p-4">
      <SidebarTrigger />
      <Button variant="destructive" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  )
}

export default Header