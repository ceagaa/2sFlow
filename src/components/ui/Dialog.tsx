import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const id = useId()
  const titleId = `dialog-title-${id}`
  const descriptionId = `dialog-description-${id}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className={cn(
        'w-[min(100%-2rem,32rem)] rounded-md border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/70',
        className,
      )}
    >
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 id={titleId} className="text-sm font-semibold">{title}</h2>
        {description && <p id={descriptionId} className="mt-1 text-xs text-zinc-400">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </dialog>,
    document.body,
  )
}
