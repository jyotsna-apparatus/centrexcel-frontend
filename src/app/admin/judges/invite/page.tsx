'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteJudge } from '@/lib/api'
import { validateEmail } from '@/lib/validate'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AdminInviteJudgePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteJudge({
        email: email.trim(),
        name: name.trim(),
        role: 'judge',
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Invitation sent')
      router.push('/admin/invitations')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateEmail(email)
    if (!validation.valid) {
      toast.error(validation.message ?? 'Invalid email')
      return
    }
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    inviteMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header>
        <Link href="/admin" className="link-highlight text-sm">
          ← Back to dashboard
        </Link>
        <h1 className="h2 mt-2 text-cs-heading">Invite judge</h1>
        <p className="p1 mt-1 text-cs-text">Send an invitation email to a judge.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cs-border bg-cs-card p-6">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-cs-heading">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="judge@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-cs-heading">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Jane Smith"
            required
          />
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-cs-heading">
            Message (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="We would be honored to have you as a judge..."
            className="w-full rounded-md border border-cs-border bg-transparent px-3 py-2 text-sm text-cs-heading outline-none focus:border-cs-primary"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={inviteMutation.isPending}>
            <Mail className="size-4" />
            Send invitation
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
