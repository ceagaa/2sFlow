import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Project, StatusTemplate, TaskStatus } from '../../kanban/types'

export const defaultStatuses: StatusTemplate['statuses'] = [
  { name: 'A fazer', category: 'todo', position: 0 },
  { name: 'Em andamento', category: 'in_progress', position: 1 },
  { name: 'Em revisão', category: 'review', position: 2 },
  { name: 'Concluído', category: 'done', position: 3 },
]

export const defaultStatusTemplate: StatusTemplate = {
  id: 'template-default',
  name: 'Padrão',
  statuses: defaultStatuses,
}

interface ProjectState {
  projects: Project[]
  statuses: TaskStatus[]
  statusTemplates: StatusTemplate[]
  activeProjectId: string
  setActiveProject: (projectId: string) => void
  addProject: (workspaceId: string, name: string, statusTemplateId?: string) => string
  duplicateProject: (projectId: string) => { projectId: string; statusIdMap: Map<string, string> } | null
  renameProject: (projectId: string, name: string) => void
  deleteProject: (projectId: string) => void
  transferProject: (projectId: string, targetWorkspaceId: string) => void
  removeProjectsForWorkspace: (workspaceId: string) => void
  reorderProjects: (workspaceId: string, projectIds: string[]) => void
  addStatus: (projectId: string, name: string, category: TaskStatus['category']) => string
  renameStatus: (statusId: string, name: string) => void
  reorderStatuses: (projectId: string, statusIds: string[]) => void
  removeStatus: (projectId: string, statusId: string) => void
  saveStatusTemplate: (projectId: string, name: string) => string
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      statuses: [],
      statusTemplates: [defaultStatusTemplate],
      activeProjectId: '',
      setActiveProject: (projectId) => {
        if (get().projects.some((project) => project.id === projectId)) {
          set({ activeProjectId: projectId })
        }
      },
      addProject: (workspaceId, name, requestedTemplateId = 'template-default') => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do projeto é obrigatório.')
        const projectId = crypto.randomUUID()
        const statusTemplate = get().statusTemplates.find((template) => template.id === requestedTemplateId)
          ?? get().statusTemplates[0]
        if (!statusTemplate) throw new Error('Não há modelos de status disponíveis.')
        const project: Project = {
          id: projectId,
          workspaceId,
          name: cleanName,
          statusTemplateId: statusTemplate.id,
        }
        const projectStatuses: TaskStatus[] = statusTemplate.statuses.map((status, index) => ({
          ...status,
          id: `${projectId}-${index}-${crypto.randomUUID().slice(0, 6)}`,
          projectId,
        }))
        set((state) => ({
          projects: [...state.projects, project],
          statuses: [...state.statuses, ...projectStatuses],
          activeProjectId: projectId,
        }))
        return projectId
      },
      duplicateProject: (projectId) => {
        const source = get().projects.find((project) => project.id === projectId)
        if (!source) return null

        const duplicateId = crypto.randomUUID()
        const sourceStatuses = get().statuses
          .filter((status) => status.projectId === projectId)
          .sort((left, right) => left.position - right.position)
        const statusIdMap = new Map(sourceStatuses.map((status) => [status.id, crypto.randomUUID()]))
        const duplicate: Project = {
          ...source,
          id: duplicateId,
          name: `${source.name} (cópia)`,
        }
        const duplicateStatuses: TaskStatus[] = sourceStatuses.map((status) => ({
          ...status,
          id: statusIdMap.get(status.id)!,
          projectId: duplicateId,
        }))

        set((state) => ({
          projects: [...state.projects, duplicate],
          statuses: [...state.statuses, ...duplicateStatuses],
          activeProjectId: duplicateId,
        }))
        return { projectId: duplicateId, statusIdMap }
      },
      renameProject: (projectId, name) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do projeto é obrigatório.')
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, name: cleanName } : project,
          ),
        }))
      },
      deleteProject: (projectId) => {
        set((state) => {
          const project = state.projects.find((item) => item.id === projectId)
          if (!project) return state
          const projects = state.projects.filter((item) => item.id !== projectId)
          const replacement = projects.find((item) => item.workspaceId === project.workspaceId) ?? projects[0]
          return {
            projects,
            statuses: state.statuses.filter((status) => status.projectId !== projectId),
            activeProjectId: state.activeProjectId === projectId ? replacement?.id ?? '' : state.activeProjectId,
          }
        })
      },
      transferProject: (projectId, targetWorkspaceId) => {
        const project = get().projects.find((item) => item.id === projectId)
        if (!project || project.workspaceId === targetWorkspaceId) return
        set((state) => ({
          projects: state.projects.map((item) =>
            item.id === projectId ? { ...item, workspaceId: targetWorkspaceId } : item,
          ),
        }))
      },
      removeProjectsForWorkspace: (workspaceId) => {
        set((state) => {
          const removedProjectIds = new Set(
            state.projects.filter((project) => project.workspaceId === workspaceId).map((project) => project.id),
          )
          const projects = state.projects.filter((project) => !removedProjectIds.has(project.id))
          return {
            projects,
            statuses: state.statuses.filter((status) => !removedProjectIds.has(status.projectId)),
            activeProjectId: removedProjectIds.has(state.activeProjectId) ? projects[0]?.id ?? '' : state.activeProjectId,
          }
        })
      },
      reorderProjects: (workspaceId, projectIds) => {
        set((state) => {
          const workspaceProjects = state.projects.filter((project) => project.workspaceId === workspaceId)
          if (projectIds.length !== workspaceProjects.length || projectIds.some((id) => !workspaceProjects.some((project) => project.id === id))) {
            return state
          }

          const projectsById = new Map(workspaceProjects.map((project) => [project.id, project]))
          const reorderedProjects = projectIds.flatMap((id) => {
            const project = projectsById.get(id)
            return project ? [project] : []
          })
          let nextProjectIndex = 0
          return {
            projects: state.projects.map((project) =>
              project.workspaceId === workspaceId ? reorderedProjects[nextProjectIndex++] : project,
            ),
          }
        })
      },
      addStatus: (projectId, name, category) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do status é obrigatório.')
        const statusId = crypto.randomUUID()
        set((state) => ({
          statuses: [
            ...state.statuses,
            {
              id: statusId,
              projectId,
              name: cleanName,
              category,
              position: state.statuses.filter((status) => status.projectId === projectId).length,
            },
          ],
        }))
        return statusId
      },
      renameStatus: (statusId, name) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do status é obrigatório.')
        set((state) => ({
          statuses: state.statuses.map((status) => status.id === statusId ? { ...status, name: cleanName } : status),
        }))
      },
      reorderStatuses: (projectId, statusIds) => {
        const positions = new Map(statusIds.map((statusId, position) => [statusId, position]))
        set((state) => ({
          statuses: state.statuses.map((status) => {
            const position = status.projectId === projectId ? positions.get(status.id) : undefined
            return position === undefined ? status : { ...status, position }
          }),
        }))
      },
      removeStatus: (projectId, statusId) => {
        const projectStatuses = get().statuses.filter((status) => status.projectId === projectId)
        if (projectStatuses.length <= 1) throw new Error('O projeto precisa ter ao menos um status.')
        if (!projectStatuses.some((status) => status.id === statusId)) return
        set((state) => ({
          statuses: state.statuses
            .filter((status) => status.id !== statusId)
            .map((status) => status.projectId === projectId && status.position > (projectStatuses.find((item) => item.id === statusId)?.position ?? -1)
              ? { ...status, position: status.position - 1 }
              : status),
        }))
      },
      saveStatusTemplate: (projectId, name) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do modelo é obrigatório.')
        const templateId = crypto.randomUUID()
        const templateStatuses = get().statuses
          .filter((status) => status.projectId === projectId)
          .sort((left, right) => left.position - right.position)
          .map(({ name: statusName, category, position }) => ({ name: statusName, category, position }))
        if (!templateStatuses.length) throw new Error('O projeto precisa ter status para salvar um modelo.')
        set((state) => ({
          statusTemplates: [...state.statusTemplates, { id: templateId, name: cleanName, statuses: templateStatuses }],
          projects: state.projects.map((project) => project.id === projectId
            ? { ...project, statusTemplateId: templateId }
            : project),
        }))
        return templateId
      },
    }),
    {
      name: '2sflow-projects',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

useProjectStore.setState((state) => ({ ...state }))
