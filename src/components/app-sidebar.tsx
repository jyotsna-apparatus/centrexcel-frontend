"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "@/components/ui/sidebar";
import {
  canAccessPath,
  getSidebarItemsForRole,
  ONBOARDING_ONLY_NAV,
} from "@/config/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import { listChallenges } from "@/lib/challenges-api";
import { cn } from "@/lib/utils";
import { isRole, type Role } from "@/types/roles";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const sidebarItems = getSidebarItemsForRole(user?.role);
  const needsOnboarding = user != null && user.isOnboarded !== true;
  const visibleItems =
    needsOnboarding && user?.role && isRole(user.role)
      ? ONBOARDING_ONLY_NAV.filter((item) =>
          item.roles.includes(user.role as Role),
        )
      : sidebarItems;
  const [usersOpen, setUsersOpen] = useState(() =>
    pathname.startsWith("/users"),
  );

  const { data: pendingApprovalsRes } = useQuery({
    queryKey: ["sidebar", "pending-approvals-count"],
    queryFn: () =>
      listChallenges({ page: 1, limit: 1, approvalStatus: "pending_review" }),
    enabled: user?.role === "admin",
  });
  const pendingApprovalCount = pendingApprovalsRes?.pagination?.total ?? 0;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const isItemActive = (item: {
    href?: string;
    children?: { href: string }[];
  }) =>
    item.href
      ? isActive(item.href)
      : (item.children?.some((c) => isActive(c.href)) ?? false);

  return (
    <Sidebar className="border-transparent bg-transparent">
      <SidebarHeader className="flex h-16 items-center justify-center border-b border-white/10">
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                {item.children ? (
                  <>
                    <SidebarMenuButton
                      asChild={false}
                      isActive={isItemActive(item)}
                      onClick={() => setUsersOpen((o) => !o)}
                      className={cn(
                        canAccessPath(item.children[0].href, user?.role)
                          ? "text-cs-primary"
                          : "text-cs-text",
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 shrink-0 transition-transform",
                          usersOpen && "rotate-180",
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
                                isActive(child.href)
                                  ? ""
                                  : canAccessPath(child.href, user?.role)
                                    ? "text-cs-primary"
                                    : "text-cs-text",
                              )}
                            >
                              <Link href={child.href}>{child.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : item.href ? (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={cn(
                      canAccessPath(item.href, user?.role)
                        ? "!text-cs-primary"
                        : "text-cs-text",
                    )}
                  >
                    <Link href={item.href} className="flex w-full items-center gap-2">
                      <item.icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.href === "/challenges/approvals" &&
                      pendingApprovalCount > 0 ? (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                          {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                        </span>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
