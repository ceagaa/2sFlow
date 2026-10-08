import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragStartEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useKanbanStore } from '../store/useKanbanStore'
import { useProjectStore } from '../../projects/store/useProjectStore'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useKanbanDnd } from '../hooks/useKanbanDnd'
import { KanbanColumn } from './KanbanColumn'
import type { Task } from '../types'

interface KanbanBoardProps {
  workspaceId: string
  projectId: string
  onTaskSelect: (taskId: string) => void
}

export function KanbanBoard({ workspaceId, projectId, onTaskSelect }: KanbanBoardProps) {
  const allTasks = useKanbanStore((state) => state.tasks)
  const statuses = useProjectStore((state) => state.statuses)
  const projectStatuses = useMemo(
    () => statuses.filter((status) => status.projectId === projectId).sort((left, right) => left.position - right.position),
    [projectId, statuses],
  )
  const projectTasks = useTaskFilters(allTasks, projectId)
  const handleDragEnd = useKanbanDnd(projectTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(projectTasks.find((task) => task.id === String(event.active.id)) ?? null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={(event) => {
        handleDragEnd(event)
        setActiveTask(null)
      }}
    >
      <div className="flex h-full min-h-0 gap-4 overflow-x-auto p-4 sm:p-6">
        {projectStatuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={projectTasks.filter((task) => task.statusId === status.id).sort((left, right) => left.position - right.position)}
            allTasks={allTasks}
            statuses={projectStatuses}
            workspaceId={workspaceId}
            projectId={projectId}
            onTaskSelect={onTaskSelect}
          />
        ))}
        {projectStatuses.length === 0 && <p className="text-sm text-zinc-500">Este projeto ainda não tem status configurados.</p>}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="w-[264px] rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm font-medium text-zinc-100 shadow-xl">
            {activeTask.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
