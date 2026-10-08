import type { StatusCategory, TaskPriority } from '../features/kanban/types'

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      workspaces: Table<
        { owner_id: string; id: string; name: string; slug: string; created_at: string },
        { owner_id?: string; id: string; name: string; slug: string; created_at?: string }
      >
      status_templates: Table<
        { owner_id: string; id: string; name: string },
        { owner_id?: string; id: string; name: string }
      >
      template_statuses: Table<
        { owner_id: string; id: string; template_id: string; name: string; category: StatusCategory; position: number },
        { owner_id?: string; id: string; template_id: string; name: string; category: StatusCategory; position: number }
      >
      projects: Table<
        { owner_id: string; id: string; workspace_id: string; name: string; status_template_id: string; position: number },
        { owner_id?: string; id: string; workspace_id: string; name: string; status_template_id: string; position?: number }
      >
      task_statuses: Table<
        { owner_id: string; id: string; project_id: string; name: string; category: StatusCategory; position: number },
        { owner_id?: string; id: string; project_id: string; name: string; category: StatusCategory; position: number }
      >
      tasks: Table<
        {
          owner_id: string
          id: string
          workspace_id: string
          project_id: string
          status_id: string
          parent_id: string | null
          title: string
          description: string | null
          priority: TaskPriority
          position: number
          due_date: string | null
          created_at: string
          updated_at: string
        },
        {
          owner_id?: string
          id: string
          workspace_id: string
          project_id: string
          status_id: string
          parent_id: string | null
          title: string
          description: string | null
          priority: TaskPriority
          position: number
          due_date: string | null
          created_at: string
          updated_at: string
        }
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
