import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '../types'
import { KanbanCard } from './KanbanCard'
import { CreateTaskInline } from './CreateTaskInline'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  allTasks: Task[]
  statuses: TaskStatus[]
  workspaceId: string
  projectId: string
  onTaskSelect: (taskId: string) => void
}

export function KanbanColumn({ status, tasks, allTasks, statuses, workspaceId, projectId, onTaskSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status.id}` })
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks])

  return (
    <section className="flex h-full w-[280px] shrink-0 flex-col" aria-label={`Coluna ${status.name}`}>
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full border border-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">{status.name}</h2>
          <span className="text-xs tabular-nums text-zinc-600">{tasks.length}</span>
        </div>
        <span className="text-zinc-600">···</span>
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-1 flex-col gap-2 rounded-md border border-dashed p-2 transition-colors ${isOver ? 'border-zinc-500 bg-zinc-900/70' : 'border-zinc-800/70'}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              subtasks={allTasks.filter((candidate) => candidate.parentId === task.id)}
              completedSubtaskCount={allTasks.filter((candidate) => candidate.parentId === task.id && statuses.find((candidateStatus) => candidateStatus.id === candidate.statusId)?.category === 'done').length}
              completed={status.category === 'done'}
              onSelect={onTaskSelect}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && <p className="py-6 text-center text-xs text-zinc-600">Solte uma tarefa aqui</p>}
        <CreateTaskInline workspaceId={workspaceId} projectId={projectId} statusId={status.id} />
      </div>
    </section>
  )
}
