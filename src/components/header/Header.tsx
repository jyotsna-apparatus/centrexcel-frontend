"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { hackathonImageSrc } from "@/components/hackathon-card/HackathonCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { logoutApi } from "@/lib/auth-api";

/** Replace with a real `profile-placeholder.avif` in /public if you prefer AVIF (same path) */
const PROFILE_PLACEHOLDER = "/profile-placeholder.svg";

function displayName(user: {
  username?: string | null;
  name?: string | null;
  email: string;
}): string {
  const u = user.username?.trim();
  if (u) return u;
  const n = user.name?.trim();
  if (n) return n;
  return user.email.split("@")[0] ?? user.email;
}

function initials(user: {
  username?: string | null;
  name?: string | null;
  email: string;
}): string {
  const base = displayName(user);
  const parts = base.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  }
  return base.slice(0, 2).toUpperCase();
}

const Header = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutApi();
    router.replace("/auth/sign-in");
  };

  const resolvedPic = user?.profilePic?.trim()
    ? hackathonImageSrc(user.profilePic)
    : null;
  const avatarSrc = resolvedPic ?? PROFILE_PLACEHOLDER;

  return (
    <>
      <div className="app-glass-surface flex h-16 w-full items-center justify-between rounded-none border-x-0 border-t-0 p-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-cs-primary"
                  aria-label="Account menu"
                >
                  <Avatar className="h-10 w-10 border border-cs-border">
                    <AvatarImage src={avatarSrc} alt="" />
                    <AvatarFallback className="bg-muted text-cs-text text-xs">
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5 border-b border-cs-border pb-2">
                    <p className="!text-xs font-medium text-cs-heading truncate ml-2 ">
                      {displayName(user)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate rounded-md border border-white/10 bg-black/55 p-1 px-2">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <User className="size-4 shrink-0" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                  onSelect={() => setLogoutDialogOpen(true)}
                >
                  <LogOut className="size-4 shrink-0" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
  );
};

export default Header;
