import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  compact?: boolean
  completed?: boolean
  onOpenChange?: (open: boolean) => void
}

const weekdays = ['2ª', '3ª', '4ª', '5ª', '6ª', 'S', 'D']
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function parseDate(value: string) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DatePicker({ value, onChange, label, compact = false, completed = false, onOpenChange }: DatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selectedDate = parseDate(value)
    const initialDate = selectedDate ?? new Date()
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  })
  const selectedDate = parseDate(value)
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node
        && !wrapperRef.current?.contains(event.target)
        && !popoverRef.current?.contains(event.target)
      ) changeOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') changeOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPosition(null)
      return
    }

    function updatePosition() {
      const anchor = wrapperRef.current?.getBoundingClientRect()
      const popover = popoverRef.current?.getBoundingClientRect()
      if (!anchor || !popover) return

      const left = Math.max(8, Math.min(anchor.right - popover.width, window.innerWidth - popover.width - 8))
      const below = anchor.bottom + 8
      const top = below + popover.height <= window.innerHeight - 8
        ? below
        : Math.max(8, anchor.top - popover.height - 8)
      setPopoverPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  function chooseDate(date: Date) {
    onChange(toDateValue(date))
    changeOpen(false)
  }

  const todayValue = toDateValue(new Date())
  const isDueOrOverdue = Boolean(value && value <= todayValue)
  const deadlineLabel = value
    ? `${isDueOrOverdue ? (value === todayValue ? 'Vence hoje' : 'Prazo vencido') : label}: ${dateFormatter.format(selectedDate!)}`
    : label

  return (
    <div
      ref={wrapperRef}
      onPointerDown={(event) => event.stopPropagation()}
      className={`relative ${open ? 'z-50' : ''}`}
    >
      <button
        type="button"
        aria-label={deadlineLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={deadlineLabel}
        onClick={() => {
          if (!open) {
            const currentDate = parseDate(value) ?? new Date()
            setVisibleMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
          }
          changeOpen(!open)
        }}
        className={compact
          ? `inline-flex h-7 items-center gap-1.5 rounded px-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
              completed
                ? 'font-medium text-green-400 hover:bg-zinc-800 hover:text-green-300'
                : value
                  ? isDueOrOverdue
                    ? 'font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
            }`
          : `flex h-9 w-full items-center gap-2 rounded-md border bg-zinc-950 px-3 text-left text-sm outline-none transition-colors ${
              completed
                ? 'border-green-900/70 text-green-400 hover:border-green-800 focus:border-green-700 focus:ring-1 focus:ring-green-900'
                : isDueOrOverdue
                  ? 'border-red-900/70 text-red-400 hover:border-red-800 focus:border-red-700 focus:ring-1 focus:ring-red-900'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
            }`}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2.25" y="3.5" width="11.5" height="10" rx="1.5" />
          <path d="M5 2v3M11 2v3M2.5 6.5h11" strokeLinecap="round" />
        </svg>
        {compact
          ? value ? <span>{dateFormatter.format(selectedDate!)}</span> : <span className="sr-only">{label}</span>
          : <span>{value ? dateFormatter.format(selectedDate!) : 'Definir data de entrega'}</span>}
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Selecionar data de entrega"
          style={popoverPosition ? { top: popoverPosition.top, left: popoverPosition.left } : { visibility: 'hidden' }}
          className="fixed z-[1000] w-64 rounded-md border border-zinc-700 bg-zinc-950 p-3 text-zinc-100 shadow-2xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
              className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
            >
              ‹
            </button>
            <span className="text-xs font-semibold capitalize">{monthFormatter.format(visibleMonth)}</span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
              className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((weekday, index) => (
              <span key={`${weekday}-${index}`} className="grid size-7 place-items-center text-[10px] font-medium text-zinc-600">
                {weekday}
              </span>
            ))}
            {Array.from({ length: cellCount }, (_, index) => {
              const dayOffset = index - firstWeekday + 1
              const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth
              const day = dayOffset < 1
                ? daysInPreviousMonth + dayOffset
                : dayOffset > daysInMonth
                  ? dayOffset - daysInMonth
                  : dayOffset
              const date = new Date(year, month + (dayOffset < 1 ? -1 : dayOffset > daysInMonth ? 1 : 0), day)
              const dateValue = toDateValue(date)
              const selected = dateValue === value
              const today = dateValue === todayValue
              return (
                <button
                  key={dateValue}
                  type="button"
                  aria-label={date.toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                  aria-pressed={selected}
                  onClick={() => chooseDate(date)}
                  className={`grid size-7 place-items-center rounded text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                    selected
                      ? 'bg-zinc-100 font-semibold text-zinc-950'
                      : isCurrentMonth
                        ? 'text-zinc-300 hover:bg-zinc-800'
                        : 'text-zinc-700 hover:bg-zinc-900 hover:text-zinc-500'
                  } ${today && !selected ? 'ring-1 ring-inset ring-zinc-600' : ''}`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-2">
            <button
              type="button"
              onClick={() => chooseDate(new Date())}
              className="rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Hoje
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  changeOpen(false)
                }}
                className="rounded px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Remover data
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
