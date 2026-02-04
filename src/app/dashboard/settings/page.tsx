'use client'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { fetchSessions, logoutAll, revokeSession, type Session } from '@/lib/api'
import { logout } from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Monitor, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function SettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [logoutThisDeviceOpen, setLogoutThisDeviceOpen] = useState(false)
  const [logoutAllDevicesOpen, setLogoutAllDevicesOpen] = useState(false)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: fetchSessions,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
      toast.success('Session revoked')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const logoutAllMutation = useMutation({
    mutationFn: logoutAll,
    onSuccess: async () => {
      await logout()
      queryClient.clear()
      toast.success('Logged out from all devices')
      router.push('/auth/login')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleLogoutCurrent = async () => {
    await logout()
    queryClient.clear()
    router.push('/auth/login')
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Settings</h1>
        <p className="p1 mt-1 text-cs-text">Account settings and active sessions.</p>
      </header>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Active sessions</h2>
        <p className="mt-1 text-sm text-cs-text">
          These are the devices where you are currently logged in. Revoke any session you don’t
          recognize.
        </p>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded bg-cs-card" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="p1 mt-4 text-cs-text">No active sessions.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(sessions as Session[]).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cs-border bg-cs-black/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="size-5 shrink-0 text-cs-text" />
                  <div>
                    <p className="font-medium text-cs-heading">{s.deviceInfo || 'Unknown device'}</p>
                    <p className="text-xs text-cs-text">
                      {s.ipAddress} · Last active: {formatDate(s.lastActive)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeMutation.mutate(s.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Logout</h2>
        <p className="mt-1 text-sm text-cs-text">
          Log out from this device only, or from all devices.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setLogoutThisDeviceOpen(true)}>
            Log out this device
          </Button>
          <Button
            variant="destructive"
            onClick={() => setLogoutAllDevicesOpen(true)}
            disabled={logoutAllMutation.isPending}
          >
            Log out all devices
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={logoutThisDeviceOpen}
        onOpenChange={setLogoutThisDeviceOpen}
        title="Log out this device"
        description="Are you sure you want to logout from this device?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={handleLogoutCurrent}
        variant="default"
      />
      <ConfirmDialog
        open={logoutAllDevicesOpen}
        onOpenChange={setLogoutAllDevicesOpen}
        title="Log out all devices"
        description="Are you sure you want to logout from all devices? You will need to sign in again on every device."
        confirmLabel="Log out all devices"
        cancelLabel="Cancel"
        onConfirm={async () => {
          await logoutAllMutation.mutateAsync()
        }}
        variant="destructive"
        loading={logoutAllMutation.isPending}
      />

      <div>
        <Link href="/dashboard/profile" className="link-highlight text-sm">
          Back to profile
        </Link>
      </div>
    </div>
  )
}
