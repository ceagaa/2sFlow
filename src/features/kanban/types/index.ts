export type StatusCategory = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type Priority = TaskPriority

export interface TaskStatus {
  id: string
  projectId: string
  name: string
  position: number
  category: StatusCategory
}

export interface Task {
  id: string
  workspaceId: string
  projectId: string
  statusId: string
  parentId: string | null
  title: string
  description?: string
  priority: TaskPriority
  position: number
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  statusTemplateId: string
}

export interface StatusTemplate {
  id: string
  name: string
  statuses: Array<Pick<TaskStatus, 'name' | 'category' | 'position'>>
}
