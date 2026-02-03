'use client'

import { AuthGuard } from '@/components/auth-guard'
import Header from '@/components/header/Header'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { fetchMe } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })

  useEffect(() => {
    if (isLoading || !user) return
    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || (user && user.role !== 'admin')) {
    return (
      <div className="flex w-full h-[100dvh] items-center justify-center">
        <div className="text-cs-text p1">Loading...</div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full h-full">
          <Header />
          <nav className="border-b border-cs-border px-4 py-2 flex gap-4">
            <Link
              href="/admin"
              className={`text-sm ${pathname === '/admin' ? 'text-cs-primary font-medium' : 'text-cs-text'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/challenges"
              className={`text-sm ${pathname === '/admin/challenges' ? 'text-cs-primary font-medium' : 'text-cs-text'}`}
            >
              Challenges
            </Link>
            <Link
              href="/admin/judges/assign"
              className={`text-sm ${pathname === '/admin/judges/assign' ? 'text-cs-primary font-medium' : 'text-cs-text'}`}
            >
              Assign judges
            </Link>
            <Link
              href="/admin/invitations"
              className={`text-sm ${pathname === '/admin/invitations' ? 'text-cs-primary font-medium' : 'text-cs-text'}`}
            >
              Invitations
            </Link>
          </nav>
          <section className="p-4 mt-2 w-full h-[calc(100dvh-8rem)]">{children}</section>
        </main>
      </SidebarProvider>
    </AuthGuard>
  )
}
