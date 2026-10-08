import { useKanbanStore } from '../store/useKanbanStore'
import { useProjectStore } from '../../projects/store/useProjectStore'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { CreateTaskInline } from './CreateTaskInline'
import { StatusBadge } from './StatusBadge'
import type { TaskPriority } from '../types'
import { Dropdown } from '../../../components/ui/Dropdown'
import { DatePicker } from '../../../components/ui/DatePicker'

interface ListViewProps {
  workspaceId: string
  projectId: string
  onTaskSelect: (taskId: string) => void
}

const priorities = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function ListView({ workspaceId, projectId, onTaskSelect }: ListViewProps) {
  const allTasks = useKanbanStore((state) => state.tasks)
  const updateTask = useKanbanStore((state) => state.updateTask)
  const statuses = useProjectStore((state) => state.statuses)
    .filter((status) => status.projectId === projectId)
    .sort((left, right) => left.position - right.position)
  const tasks = useTaskFilters(allTasks, projectId)

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="min-w-[760px] space-y-6">
        {statuses.map((status) => {
          const groupTasks = tasks.filter((task) => task.statusId === status.id).sort((left, right) => left.position - right.position)
          return (
            <section key={status.id} aria-label={`Grupo ${status.name}`}>
              <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <StatusBadge status={status} />
                <span className="text-xs tabular-nums text-zinc-500">{groupTasks.length}</span>
              </div>
              {groupTasks.length > 0 && (
                <div className="divide-y divide-zinc-800/70">
                  {groupTasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-[minmax(220px,1fr)_140px_130px_140px_70px] items-center gap-3 py-2">
                      <button className="truncate text-left text-sm text-zinc-200 hover:text-white" onClick={() => onTaskSelect(task.id)}>
                        {task.title}
                      </button>
                      <Dropdown
                        aria-label={`Status de ${task.title}`}
                        value={task.statusId}
                        options={statuses.map((item) => ({ value: item.id, label: item.name }))}
                        className="h-8 text-xs"
                        onChange={(event) => updateTask(task.id, { statusId: event.target.value })}
                      />
                      <Dropdown
                        aria-label={`Prioridade de ${task.title}`}
                        value={task.priority}
                        options={priorities}
                        className="h-8 text-xs"
                        onChange={(event) => updateTask(task.id, { priority: event.target.value as TaskPriority })}
                      />
                      <DatePicker
                        compact
                        label={`Data de entrega de ${task.title}`}
                        value={task.dueDate ?? ''}
                        onChange={(dueDate) => updateTask(task.id, { dueDate: dueDate || undefined })}
                      />
                      <span className="text-right text-xs tabular-nums text-zinc-500">
                        {allTasks.filter((candidate) => candidate.parentId === task.id).length || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <CreateTaskInline workspaceId={workspaceId} projectId={projectId} statusId={status.id} />
            </section>
          )
        })}
        {!statuses.length && <p className="text-sm text-zinc-500">Este projeto ainda não tem status configurados.</p>}
      </div>
    </div>
  )
}
