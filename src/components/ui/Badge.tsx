import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'solid' | 'outline' | 'muted'
}

const variants = {
  solid: 'border border-zinc-100 bg-zinc-100 text-zinc-950',
  outline: 'border border-zinc-700 bg-transparent text-zinc-300',
  muted: 'border border-zinc-800 bg-zinc-900 text-zinc-400',
}

export function Badge({ className, variant = 'muted', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  )
}
