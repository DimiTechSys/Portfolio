'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  onDebouncedChange: (value: string) => void
  debounceMs?: number
}

export function SearchInput({
  value,
  onValueChange,
  onDebouncedChange,
  debounceMs = 300,
  className,
  ...props
}: SearchInputProps) {
  const onDebouncedRef = useRef(onDebouncedChange)

  useEffect(() => {
    onDebouncedRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      onDebouncedRef.current(value)
    }, debounceMs)
    return () => window.clearTimeout(handle)
  }, [value, debounceMs])

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(className)}
    />
  )
}
