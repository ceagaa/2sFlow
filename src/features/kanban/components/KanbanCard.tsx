import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { DatePicker } from '../../../components/ui/DatePicker'
import { useKanbanStore } from '../store/useKanbanStore'

interface KanbanCardProps {
  task: Task
  subtasks: Task[]
  completedSubtaskCount: number
  completed: boolean
  onSelect: (taskId: string) => void
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export function KanbanCard({ task, subtasks, completedSubtaskCount, completed, onSelect }: KanbanCardProps) {
  const updateTask = useKanbanStore((state) => state.updateTask)
  const duplicateTask = useKanbanStore((state) => state.duplicateTask)
  const [menuOpen, setMenuOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { statusId: task.statusId },
  })

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function duplicate() {
    setMenuOpen(false)
    duplicateTask(task.id)
  }

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-left shadow-sm transition-colors hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${datePickerOpen ? 'z-50' : ''} ${isDragging ? 'z-10 opacity-50' : ''}`}
      {...attributes}
      {...listeners}
      role="group"
      aria-label={task.title}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          onClick={() => onSelect(task.id)}
        >
          <span className="text-sm font-medium leading-5 text-zinc-100">{task.title}</span>
          {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{task.description}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">{priorityLabels[task.priority]}</span>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={`Opções da tarefa ${task.title}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Opções da tarefa"
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpen((open) => !open)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={`grid size-6 place-items-center rounded text-sm leading-none text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                menuOpen ? 'bg-zinc-800 text-zinc-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              }`}
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label={`Opções da tarefa ${task.title}`}
                className="absolute right-0 top-full z-30 mt-1 w-36 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={duplicate}
                  className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
                >
                  Duplicar tarefa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <DatePicker
            compact
            label="Definir data de entrega"
            value={task.dueDate ?? ''}
            completed={completed}
            onOpenChange={setDatePickerOpen}
            onChange={(dueDate) => updateTask(task.id, { dueDate: dueDate || undefined })}
          />
        </div>
        {subtasks.length > 0 && <span className="text-[11px] tabular-nums text-zinc-500">{completedSubtaskCount}/{subtasks.length}</span>}
      </div>
    </article>
  )
}
