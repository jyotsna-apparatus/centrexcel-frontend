'use client'

import { fetchMe } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Mail, Building2, Phone, Link2 } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
  })

  if (isLoading && !user) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-cs-card" />
        <div className="h-48 animate-pulse rounded-lg bg-cs-card" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div>
        <p className="p1 text-destructive">Failed to load profile.</p>
        <Link href="/dashboard" className="link-highlight mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const socialLinks = user.socialLinks
    ? Object.entries(user.socialLinks).filter(([, v]) => v && v.trim())
    : []

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Profile</h1>
        <p className="p1 mt-1 text-cs-text">Your account information.</p>
      </header>

      <section className="rounded-lg border border-cs-border bg-cs-card p-6">
        <h2 className="font-semibold text-cs-heading">Basic info</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-cs-text">Name</span>
            <span className="text-cs-heading">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-cs-text" />
            <span className="text-cs-heading">{user.email}</span>
          </div>
          {user.role && (
            <div className="flex items-center gap-3">
              <span className="text-cs-text">Role</span>
              <span className="capitalize text-cs-heading">{user.role}</span>
            </div>
          )}
          {user.mobile && (
            <div className="flex items-center gap-3">
              <Phone className="size-4 shrink-0 text-cs-text" />
              <span className="text-cs-heading">{user.mobile}</span>
            </div>
          )}
          {user.organization && (
            <div className="flex items-center gap-3">
              <Building2 className="size-4 shrink-0 text-cs-text" />
              <span className="text-cs-heading">{user.organization}</span>
            </div>
          )}
        </dl>
      </section>

      {(user.domain || user.experienceSummary || (user.skills && user.skills.length > 0)) && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="font-semibold text-cs-heading">Experience</h2>
          {user.domain && (
            <p className="mt-2 text-sm text-cs-text">
              <span className="text-cs-text">Domain:</span> {user.domain}
            </p>
          )}
          {user.skills && user.skills.length > 0 && (
            <p className="mt-2 text-sm text-cs-text">
              <span className="text-cs-text">Skills:</span> {user.skills.join(', ')}
            </p>
          )}
          {user.experienceSummary && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-cs-text">
              {user.experienceSummary}
            </p>
          )}
        </section>
      )}

      {socialLinks.length > 0 && (
        <section className="rounded-lg border border-cs-border bg-cs-card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-cs-heading">
            <Link2 className="size-4" />
            Social links
          </h2>
          <ul className="mt-3 space-y-2">
            {socialLinks.map(([key, url]) => (
              <li key={key}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-highlight capitalize"
                >
                  {key}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-3">
        <Link href="/dashboard/settings" className="link-highlight text-sm">
          Account settings & sessions
        </Link>
        <Link href="/dashboard" className="link-highlight text-sm">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
