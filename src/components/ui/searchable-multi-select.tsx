'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface SearchableMultiSelectOption {
  value: string
  label: string
  isFavorite?: boolean
}

export interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  max?: number
  className?: string
  id?: string
  'aria-invalid'?: boolean
  disabled?: boolean
}

export function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No result found.',
  max = 5,
  className,
  id,
  'aria-invalid': ariaInvalid,
  disabled,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label)
  const display = selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder

  const toggle = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : value.length >= max
        ? value
        : [...value, optValue]
    onChange(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', value.length === 0 && 'text-muted-foreground', className)}
        >
          <span className="truncate">{display}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value.includes(opt.value)
                const atMax = value.length >= max && !isSelected
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => !atMax && toggle(opt.value)}
                    className={cn(atMax && 'opacity-50')}
                  >
                    <Check className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    {opt.isFavorite && <Star className="mr-2 size-4 fill-amber-400 text-amber-500" />}
                    {opt.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
