'use client';

import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { getSidebarItemsForRole } from '@/config/sidebar-nav';
import { useAuth } from '@/contexts/auth-context';
import { canAccessPath } from '@/config/sidebar-nav';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const sidebarItems = getSidebarItemsForRole(user?.role);
  const [usersOpen, setUsersOpen] = useState(() => pathname.startsWith('/users'));

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const isItemActive = (item: { href?: string; children?: { href: string }[] }) =>
    item.href ? isActive(item.href) : (item.children?.some((c) => isActive(c.href)) ?? false);

  return (
    <Sidebar className="bg-cs-card border-r border-cs-border">
      <SidebarHeader className="bg-cs-card border-b border-cs-border h-16 flex items-center justify-center">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <Image
            src="/logo-full.svg"
            alt="Centrexcel"
            width={180}
            height={35}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-cs-card">
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                {item.children ? (
                  <>
                    <SidebarMenuButton
                      asChild={false}
                      isActive={isItemActive(item)}
                      onClick={() => setUsersOpen((o) => !o)}
                      className={cn(
                        canAccessPath(item.children[0].href, user?.role)
                          ? 'text-cs-primary'
                          : 'text-cs-text'
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                      <ChevronDown
                        className={cn(
                          'ml-auto size-4 shrink-0 transition-transform',
                          usersOpen && 'rotate-180'
                        )}
                      />
                    </SidebarMenuButton>
                    {usersOpen && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(child.href)}
                              className={cn(
                                canAccessPath(child.href, user?.role)
                                  ? 'text-cs-primary'
                                  : 'text-cs-text'
                              )}
                            >
                              <Link href={child.href}>{child.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={item.href ? isActive(item.href) : false}
                    className={cn(
                      item.href && canAccessPath(item.href, user?.role)
                        ? 'text-cs-primary'
                        : 'text-cs-text'
                    )}
                  >
                    <Link href={item.href!}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
