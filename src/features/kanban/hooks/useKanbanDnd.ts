import { useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useKanbanStore } from '../store/useKanbanStore'
import { getReorderedTaskIds } from '../utils/reorderTasks'

export function useKanbanDnd(projectTasks: ReturnType<typeof useKanbanStore.getState>['tasks']) {
  const reorderTasks = useKanbanStore((state) => state.reorderTasks)

  return useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const overIsStatus = String(over.id).startsWith('status:')
    const overId = overIsStatus ? String(over.id).slice('status:'.length) : String(over.id)
    const result = getReorderedTaskIds(projectTasks, String(active.id), overId, overIsStatus)
    if (result) reorderTasks(result.groups)
  }, [projectTasks, reorderTasks])
}
