import { useMemo } from 'react'
import type { Task } from '../types'

export function useTaskFilters(tasks: Task[], projectId: string) {
  return useMemo(
    () => tasks.filter((task) => task.projectId === projectId && task.parentId === null),
    [projectId, tasks],
  )
}
