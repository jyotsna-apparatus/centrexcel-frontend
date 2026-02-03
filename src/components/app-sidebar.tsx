'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { fetchMe } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppSidebar() {
  const pathname = usePathname()
  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })
  const role = user?.role ?? ''

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <Sidebar className="bg-cs-card border-r border-cs-border">
      <SidebarHeader className="bg-cs-card" />
      <SidebarContent className="bg-cs-card">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/profile')}>
                <Link href="/dashboard/profile">
                  <User className="size-4" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/settings')}>
                <Link href="/dashboard/settings">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/teams')}>
                <Link href="/dashboard/teams">
                  <Users className="size-4" />
                  <span>Teams</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/dashboard/participations')}>
                <Link href="/dashboard/participations">
                  <Award className="size-4" />
                  <span>Participations</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/submissions')}>
                <Link href="/dashboard/submissions">
                  <FileText className="size-4" />
                  <span>Submissions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {(role === 'judge' || role === 'sponsor' || role === 'admin' || role === 'organizer') && (
          <SidebarGroup>
            <SidebarMenu>
              {role === 'judge' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/judge')}>
                    <Link href="/judge">
                      <Award className="size-4" />
                      <span>Judge</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(role === 'sponsor' || role === 'admin' || role === 'organizer') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/sponsor')}>
                    <Link href="/sponsor">
                      <Award className="size-4" />
                      <span>Sponsor</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')}>
                    <Link href="/admin">
                      <Shield className="size-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="bg-cs-card">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/challenges">
                <Award className="size-4" />
                <span>Challenges</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
