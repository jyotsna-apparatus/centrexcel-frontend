'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { hackathonImageSrc } from '@/components/hackathon-card/HackathonCard'
import type { UserListItem } from '@/lib/auth-api'
import { userListInitials, userTablePrimaryLine } from '@/lib/user-display'

const PROFILE_PLACEHOLDER = '/profile-placeholder.svg'

type Props = {
  user: UserListItem
}

export function UserTableProfileCell({ user }: Props) {
  const src = hackathonImageSrc(user.profilePic ?? null)
  const primary = userTablePrimaryLine(user)
  const initials = userListInitials(user)

  return (
    <div className="flex max-w-[min(100%,320px)] items-center gap-3">
      <Avatar className="size-9 shrink-0 border border-cs-border">
        <AvatarImage src={src ?? PROFILE_PLACEHOLDER} alt="" />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{primary}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}
