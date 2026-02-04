'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { SidebarTrigger } from '../ui/sidebar'

const Header = () => {
  const router = useRouter()
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace('/auth/login')
  }

  return (
    <>
      <div className="flex items-center justify-between w-full h-16 bg-cs-card border-b border-cs-border p-4">
        <SidebarTrigger />
        <Button variant="destructive" onClick={() => setLogoutDialogOpen(true)}>
          Logout
        </Button>
      </div>
      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logout"
        description="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        variant="destructive"
      />
    </>
  )
}

export default Header