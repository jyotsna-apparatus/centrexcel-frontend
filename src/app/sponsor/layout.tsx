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

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })

  useEffect(() => {
    if (isLoading || !user) return
    const allowed = ['sponsor', 'admin', 'organizer']
    if (!allowed.includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || (user && !['sponsor', 'admin', 'organizer'].includes(user.role))) {
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
          <nav className="border-b border-cs-border bg-cs-card/50 px-4 py-2 flex items-center gap-1">
            {[
              { href: '/sponsor', label: 'Dashboard' },
              { href: '/sponsor/invitations', label: 'Invitations' },
            ].map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-cs-primary/20 text-cs-primary shadow-[inset_0_0_0_1px_rgba(213,255,64,0.3)]'
                      : 'text-cs-text hover:bg-white/8 hover:text-cs-heading'
                    }
                  `}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <section className="p-4 mt-2 w-full h-[calc(100dvh-8rem)]">{children}</section>
        </main>
      </SidebarProvider>
    </AuthGuard>
  )
}
