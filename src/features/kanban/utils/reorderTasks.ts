import { arrayMove } from '@dnd-kit/sortable'
import type { Task } from '../types'

export function getReorderedTaskIds(
  tasks: Task[],
  activeTaskId: string,
  overId: string,
  overIsStatus: boolean,
) {
  const activeTask = tasks.find((task) => task.id === activeTaskId)
  if (!activeTask) return null

  const targetTask = tasks.find((task) => task.id === overId)
  const targetStatusId = overIsStatus ? overId : targetTask?.statusId
  if (!targetStatusId) return null

  const sourceTasks = tasks
    .filter((task) => task.statusId === activeTask.statusId && task.parentId === null)
    .sort((left, right) => left.position - right.position)
  const destinationTasks = tasks
    .filter((task) => task.statusId === targetStatusId && task.parentId === null)
    .sort((left, right) => left.position - right.position)

  if (activeTask.statusId === targetStatusId) {
    const oldIndex = sourceTasks.findIndex((task) => task.id === activeTaskId)
    const newIndex = overIsStatus
      ? sourceTasks.length - 1
      : sourceTasks.findIndex((task) => task.id === overId)
    if (newIndex < 0 || oldIndex < 0 || newIndex === oldIndex) return null
    return {
      groups: [{
        statusId: targetStatusId,
        taskIds: arrayMove(sourceTasks, oldIndex, newIndex).map((task) => task.id),
      }],
    }
  }

  const sourceWithoutActive = sourceTasks.filter((task) => task.id !== activeTaskId)
  const insertIndex = overIsStatus
    ? destinationTasks.length
    : destinationTasks.findIndex((task) => task.id === overId)
  const nextDestination = [...destinationTasks]
  nextDestination.splice(insertIndex < 0 ? nextDestination.length : insertIndex, 0, activeTask)

  return {
    groups: [
      { statusId: activeTask.statusId, taskIds: sourceWithoutActive.map((task) => task.id) },
      { statusId: targetStatusId, taskIds: nextDestination.map((task) => task.id) },
    ],
  }
}
