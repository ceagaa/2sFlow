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
  removeTasksForProject: (projectId: string) => void
  removeTasksForWorkspace: (workspaceId: string) => void
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
      removeTasksForProject: (projectId) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.projectId !== projectId) }))
      },
      removeTasksForWorkspace: (workspaceId) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.workspaceId !== workspaceId) }))
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
