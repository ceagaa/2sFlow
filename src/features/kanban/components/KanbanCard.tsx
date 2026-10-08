import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskStatus } from '../types'
import { Badge } from '../../../components/ui/Badge'

interface KanbanCardProps {
  task: Task
  status?: TaskStatus
  subtasks: Task[]
  completedSubtaskCount: number
  onSelect: (taskId: string) => void
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export function KanbanCard({ task, status, subtasks, completedSubtaskCount, onSelect }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { statusId: task.statusId },
  })

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`w-full rounded-md border border-zinc-800 bg-zinc-900 p-3 text-left shadow-sm transition-colors hover:border-zinc-600 ${isDragging ? 'z-10 opacity-50' : ''}`}
      onClick={() => onSelect(task.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-5 text-zinc-100">{task.title}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-500">{priorityLabels[task.priority]}</span>
      </div>
      {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {status && <Badge variant="outline" className="max-w-24 truncate">{status.name}</Badge>}
          {task.dueDate && <span className="text-[11px] text-zinc-500">{task.dueDate}</span>}
        </div>
        {subtasks.length > 0 && <span className="text-[11px] tabular-nums text-zinc-500">{completedSubtaskCount}/{subtasks.length}</span>}
      </div>
    </button>
  )
}
