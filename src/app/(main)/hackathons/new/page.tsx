'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/pageHeader/PageHeader'
import {
  createHackathon,
  getUsers,
  getFavorites,
  type CreateHackathonFormData,
  type UserListItem,
} from '@/lib/auth-api'
import { HACKATHON_CONSTANTS } from '@/config/hackathon-constants'
import { cn } from '@/lib/utils'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { TiptapEditor } from '@/components/ui/tiptap-editor'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { ArrowLeft, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

function toOptions(
  users: UserListItem[],
  favoriteIds: Set<string>
): { value: string; label: string; isFavorite: boolean }[] {
  return users.map((u) => ({
    value: u.id,
    label: u.username || u.email || u.id,
    isFavorite: favoriteIds.has(u.id),
  }))
}

function sortWithFavoritesFirst<T extends { isFavorite?: boolean }>(options: T[]): T[] {
  return [...options].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
}

export default function NewHackathonPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  const [scoringDeadline, setScoringDeadline] = useState('')
  const [instructions, setInstructions] = useState('')
  const [sponsorId, setSponsorId] = useState('')
  const [judgeIds, setJudgeIds] = useState<string[]>([])
  const [isPaid, setIsPaid] = useState(false)
  const [priceOfEntry, setPriceOfEntry] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: sponsorsData } = useQuery({
    queryKey: ['users', 'sponsor', 1, 100],
    queryFn: () => getUsers({ page: 1, limit: 100, role: 'sponsor' }),
  })
  const { data: judgesData } = useQuery({
    queryKey: ['users', 'judge', 1, 100],
    queryFn: () => getUsers({ page: 1, limit: 100, role: 'judge' }),
  })
  const { data: sponsorFavoritesData } = useQuery({
    queryKey: ['favorites', 'sponsor'],
    queryFn: () => getFavorites('sponsor'),
  })
  const { data: judgeFavoritesData } = useQuery({
    queryKey: ['favorites', 'judge'],
    queryFn: () => getFavorites('judge'),
  })

  const sponsors: UserListItem[] = sponsorsData?.data ?? []
  const judges: UserListItem[] = judgesData?.data ?? []
  const sponsorFavoriteIds = useMemo(
    () => new Set((sponsorFavoritesData?.data ?? []).map((f) => f.favoriteId)),
    [sponsorFavoritesData]
  )
  const judgeFavoriteIds = useMemo(
    () => new Set((judgeFavoritesData?.data ?? []).map((f) => f.favoriteId)),
    [judgeFavoritesData]
  )

  const sponsorOptions = useMemo(
    () => sortWithFavoritesFirst(toOptions(sponsors, sponsorFavoriteIds)),
    [sponsors, sponsorFavoriteIds]
  )
  const judgeOptions = useMemo(
    () => sortWithFavoritesFirst(toOptions(judges, judgeFavoriteIds)),
    [judges, judgeFavoriteIds]
  )

  const mutation = useMutation({
    mutationFn: (form: CreateHackathonFormData) => createHackathon(form),
    onSuccess: () => {
      toast.success('Hackathon created successfully.')
      router.push('/hackathons')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to create hackathon')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}

    if (!title.trim()) next.title = 'Title is required'
    else if (title.length > HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE) {
      next.title = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE} characters`
    }

    if (!shortDescription.trim()) next.shortDescription = 'Short description is required'
    else if (shortDescription.length > HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION) {
      next.shortDescription = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION} characters`
    }

    if (!submissionDeadline) next.submissionDeadline = 'Submission deadline is required'
    else if (new Date(submissionDeadline) <= new Date()) {
      next.submissionDeadline = 'Must be a future date'
    }

    if (!scoringDeadline) next.scoringDeadline = 'Scoring deadline is required'
    else if (submissionDeadline && new Date(scoringDeadline) <= new Date(submissionDeadline)) {
      next.scoringDeadline = 'Must be after submission deadline'
    }

    const instructionsPlain = instructions.replace(/<[^>]*>/g, '').trim()
    if (!instructionsPlain) next.instructions = 'Instructions are required'
    else if (instructions.length > HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS) {
      next.instructions = `Max ${HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS} characters`
    }

    if (!sponsorId) next.sponsorId = 'Please select a sponsor'

    if (judgeIds.length < HACKATHON_CONSTANTS.JUDGE_COUNT.MIN) {
      next.judgeIds = `Select at least ${HACKATHON_CONSTANTS.JUDGE_COUNT.MIN} judge(s)`
    } else if (judgeIds.length > HACKATHON_CONSTANTS.JUDGE_COUNT.MAX) {
      next.judgeIds = `Maximum ${HACKATHON_CONSTANTS.JUDGE_COUNT.MAX} judges`
    }

    if (isPaid) {
      const n = Number.parseFloat(priceOfEntry)
      if (Number.isNaN(n) || n <= 0) next.priceOfEntry = 'Enter a positive amount in ₹'
    }

    if (image && image.size > HACKATHON_CONSTANTS.FILE_LIMITS.MAX_IMAGE_SIZE) {
      next.image = 'Image must be 2 MB or less'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the errors below.')
      return
    }

    const form: CreateHackathonFormData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      submissionDeadline: new Date(submissionDeadline).toISOString(),
      scoringDeadline: new Date(scoringDeadline).toISOString(),
      instructions: instructions.trim(),
      sponsorId,
      judgeIds,
      isPaid,
      priceOfEntry: isPaid && priceOfEntry ? Number(priceOfEntry) : null,
      image: image ?? undefined,
    }
    mutation.mutate(form)
  }

  return (
    <div>
      <PageHeader title="Create hackathon" description="Add a new hackathon event.">
        <Button variant="outline"  asChild>
          <Link href="/hackathons">
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Hackathon title"
            maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.TITLE}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="shortDescription">
            Short description
          </label>
          <textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief description"
            rows={3}
            maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.SHORT_DESCRIPTION}
            className="border-cs-border placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus:ring-2 focus:ring-cs-primary/20"
          />
          {errors.shortDescription && <p className="text-sm text-destructive">{errors.shortDescription}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Submission deadline</label>
            <DateTimePicker
              value={submissionDeadline}
              onChange={setSubmissionDeadline}
              placeholder="Pick date and time"
              className={errors.submissionDeadline ? 'border-destructive' : ''}
              aria-invalid={!!errors.submissionDeadline}
            />
            {errors.submissionDeadline && (
              <p className="text-sm text-destructive">{errors.submissionDeadline}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Scoring deadline</label>
            <DateTimePicker
              value={scoringDeadline}
              onChange={setScoringDeadline}
              placeholder="Pick date and time"
              className={errors.scoringDeadline ? 'border-destructive' : ''}
              aria-invalid={!!errors.scoringDeadline}
            />
            {errors.scoringDeadline && (
              <p className="text-sm text-destructive">{errors.scoringDeadline}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instructions</label>
          <TiptapEditor
            value={instructions}
            onChange={setInstructions}
            placeholder="Rules and instructions for participants"
            maxLength={HACKATHON_CONSTANTS.TEXT_LIMITS.INSTRUCTIONS}
            className={errors.instructions ? 'border-destructive' : ''}
            aria-invalid={!!errors.instructions}
          />
          {errors.instructions && <p className="text-sm text-destructive">{errors.instructions}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sponsor</label>
          <SearchableSelect
            options={sponsorOptions}
            value={sponsorId}
            onChange={setSponsorId}
            placeholder="Select sponsor"
            searchPlaceholder="Search sponsors..."
            emptyText="No sponsor found."
            className={errors.sponsorId ? 'border-destructive' : ''}
            aria-invalid={!!errors.sponsorId}
          />
          {errors.sponsorId && <p className="text-sm text-destructive">{errors.sponsorId}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Judges (1–5)</label>
          <SearchableMultiSelect
            options={judgeOptions}
            value={judgeIds}
            onChange={setJudgeIds}
            placeholder="Select judges"
            searchPlaceholder="Search judges..."
            emptyText="No judge found."
            max={HACKATHON_CONSTANTS.JUDGE_COUNT.MAX}
            className={errors.judgeIds ? 'border-destructive' : ''}
            aria-invalid={!!errors.judgeIds}
          />
          <p className="text-xs text-muted-foreground">Select 1–5 judges. Favorites appear first.</p>
          {errors.judgeIds && <p className="text-sm text-destructive">{errors.judgeIds}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Entry fee</label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-input p-0.5">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  !isPaid
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  isPaid
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Paid
              </button>
            </div>
            {isPaid && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  <IndianRupee className="inline size-4" />
                </span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Amount"
                  value={priceOfEntry}
                  onChange={(e) => setPriceOfEntry(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">INR</span>
              </div>
            )}
          </div>
          {errors.priceOfEntry && <p className="text-sm text-destructive">{errors.priceOfEntry}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="image">
            Banner image (optional, max 2 MB)
          </label>
          <Input
            id="image"
            type="file"
            accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg,image/jpg"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
          {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
        </div>

        <div className="flex gap-3 pb-[100px]">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create hackathon'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/hackathons">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
