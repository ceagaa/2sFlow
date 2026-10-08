import { Button } from './Button'
import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}
