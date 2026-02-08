'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  'aria-invalid'?: boolean
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date and time',
  className,
  id,
  'aria-invalid': ariaInvalid,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined
  const [timeStr, setTimeStr] = React.useState(() =>
    date ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '23:59'
  )
  React.useEffect(() => {
    if (value) {
      const d = new Date(value)
      setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    } else {
      setTimeStr('23:59')
    }
  }, [value])

  const handleSelect = (d: Date | undefined) => {
    if (!d) return
    const [h, m] = timeStr.split(':').map(Number)
    const next = new Date(d)
    next.setHours(Number.isNaN(h) ? 23 : h, Number.isNaN(m) ? 59 : m, 0, 0)
    onChange?.(next.toISOString())
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setTimeStr(v)
    if (date && v.match(/^\d{1,2}:\d{2}$/)) {
      const [h, m] = v.split(':').map(Number)
      const next = new Date(date)
      next.setHours(h, m, 0, 0)
      onChange?.(next.toISOString())
    }
  }

  const displayDate = date ? new Date(date) : undefined
  if (displayDate && timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      displayDate.setHours(h, m, 0, 0)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? (
            <>
              {format(new Date(value), 'PPP')} at {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </>
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => handleSelect(d)}
          initialFocus
        />
        <div className="border-t p-3">
          <label className="text-xs text-muted-foreground">Time</label>
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="mt-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
