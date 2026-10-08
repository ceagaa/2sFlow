import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface DropdownOption {
  value: string
  label: string
}

export interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: DropdownOption[]
  placeholder?: string
}

export function Dropdown({ className, options, placeholder, ...props }: DropdownProps) {
  return (
    <select
      className={cn(
        'h-9 w-full appearance-none rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}
