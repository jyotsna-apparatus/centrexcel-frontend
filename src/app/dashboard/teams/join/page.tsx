'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinTeam } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function JoinTeamPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  const joinMutation = useMutation({
    mutationFn: joinTeam,
    onSuccess: (data) => {
      toast.success('Joined team successfully')
      router.push(`/dashboard/teams/${data.team.id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      toast.error('Enter an invite code')
      return
    }
    joinMutation.mutate(trimmed)
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <Link href="/dashboard/teams" className="link-highlight text-sm">
          ← Back to teams
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Join team</h1>
        <p className="p1 mt-1 text-cs-text">Enter the invite code shared by your team leader.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium text-cs-heading">
            Invite code
          </label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123XY"
            className="font-mono uppercase"
            maxLength={20}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={joinMutation.isPending}>
            Join team
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/teams">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
