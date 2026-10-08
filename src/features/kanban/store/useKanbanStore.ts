import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Task, TaskPriority } from '../types'

interface KanbanState {
  tasks: Task[]
  addTask: (input: {
    workspaceId: string
    projectId: string
    statusId: string
    title: string
    parentId?: string | null
    priority?: TaskPriority
  }) => string
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  duplicateTask: (taskId: string) => string | null
  duplicateTasksForProject: (
    sourceProjectId: string,
    targetProjectId: string,
    targetWorkspaceId: string,
    statusIdMap: Map<string, string>,
  ) => void
  removeTasksForProject: (projectId: string) => void
  removeTasksForWorkspace: (workspaceId: string) => void
  transferTasksForProject: (projectId: string, workspaceId: string) => void
  reorderTasks: (groups: Array<{ statusId: string; taskIds: string[] }>) => void
  moveTasksToStatus: (fromStatusId: string, toStatusId: string) => void
  deleteTask: (taskId: string) => void
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: ({ workspaceId, projectId, statusId, title, parentId = null, priority = 'medium' }) => {
        const now = new Date().toISOString()
        const taskId = crypto.randomUUID()
        const position = get().tasks.filter((task) => task.statusId === statusId && task.parentId === parentId).length
        const task: Task = {
          id: taskId,
          workspaceId,
          projectId,
          statusId,
          parentId,
          title,
          priority,
          position,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
        return taskId
      },
      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
          ),
        }))
      },
      duplicateTask: (taskId) => {
        const sourceTasks = get().tasks
        const source = sourceTasks.find((task) => task.id === taskId)
        if (!source) return null
        const taskIds = new Set([taskId])
        let hasDescendants = true
        while (hasDescendants) {
          hasDescendants = false
          for (const task of sourceTasks) {
            if (task.parentId && taskIds.has(task.parentId) && !taskIds.has(task.id)) {
              taskIds.add(task.id)
              hasDescendants = true
            }
          }
        }

        const idMap = new Map([...taskIds].map((id) => [id, crypto.randomUUID()]))
        const nextPositions = new Map<string, number>()
        const now = new Date().toISOString()
        const duplicates = sourceTasks
          .filter((task) => taskIds.has(task.id))
          .map((task) => {
            const newParentId = task.parentId ? idMap.get(task.parentId) ?? null : null
            const groupKey = `${task.statusId}:${newParentId ?? 'root'}`
            const position = nextPositions.get(groupKey)
              ?? get().tasks.filter((candidate) => candidate.statusId === task.statusId && candidate.parentId === newParentId).length
            nextPositions.set(groupKey, position + 1)
            return {
              ...task,
              id: idMap.get(task.id)!,
              parentId: newParentId,
              title: task.id === taskId ? `${task.title} (cópia)` : task.title,
              position,
              createdAt: now,
              updatedAt: now,
            }
          })

        set((state) => ({ tasks: [...state.tasks, ...duplicates] }))
        return idMap.get(taskId) ?? null
      },
      duplicateTasksForProject: (sourceProjectId, targetProjectId, targetWorkspaceId, statusIdMap) => {
        const sourceTasks = get().tasks.filter((task) => task.projectId === sourceProjectId)
        if (!sourceTasks.length) return
        const idMap = new Map(sourceTasks.map((task) => [task.id, crypto.randomUUID()]))
        const now = new Date().toISOString()
        const duplicates = sourceTasks.map((task) => ({
          ...task,
          id: idMap.get(task.id)!,
          workspaceId: targetWorkspaceId,
          projectId: targetProjectId,
          statusId: statusIdMap.get(task.statusId) ?? task.statusId,
          parentId: task.parentId ? idMap.get(task.parentId) ?? null : null,
          createdAt: now,
          updatedAt: now,
        }))
        set((state) => ({ tasks: [...state.tasks, ...duplicates] }))
      },
      removeTasksForProject: (projectId) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.projectId !== projectId) }))
      },
      removeTasksForWorkspace: (workspaceId) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.workspaceId !== workspaceId) }))
      },
      transferTasksForProject: (projectId, workspaceId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.projectId === projectId && task.workspaceId !== workspaceId
              ? { ...task, workspaceId }
              : task,
          ),
        }))
      },
      reorderTasks: (groups) => {
        const updates = new Map<string, { statusId: string; position: number }>()
        for (const group of groups) {
          group.taskIds.forEach((taskId, position) => updates.set(taskId, { statusId: group.statusId, position }))
        }
        set((state) => ({
          tasks: state.tasks.map((task) => {
            const update = updates.get(task.id)
            return update ? { ...task, ...update, updatedAt: new Date().toISOString() } : task
          }),
        }))
      },
      moveTasksToStatus: (fromStatusId, toStatusId) => {
        set((state) => {
          const nextPosition = state.tasks.filter((task) => task.statusId === toStatusId && task.parentId === null).length
          let offset = 0
          const tasks = state.tasks.map((task) => {
            if (task.statusId !== fromStatusId) return task
            const position = task.parentId === null ? nextPosition + offset++ : task.position
            return { ...task, statusId: toStatusId, position, updatedAt: new Date().toISOString() }
          })
          return { tasks }
        })
      },
      deleteTask: (taskId) => {
        const taskIds = new Set([taskId])
        let hasDescendants = true
        while (hasDescendants) {
          hasDescendants = false
          for (const task of get().tasks) {
            if (task.parentId && taskIds.has(task.parentId) && !taskIds.has(task.id)) {
              taskIds.add(task.id)
              hasDescendants = true
            }
          }
        }
        set((state) => ({ tasks: state.tasks.filter((task) => !taskIds.has(task.id)) }))
      },
    }),
    {
      name: '2sflow-kanban',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

useKanbanStore.setState((state) => ({ ...state }))
