import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Workspace } from '../../kanban/types'

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string
  setActiveWorkspace: (workspaceId: string) => void
  addWorkspace: (name: string) => string
  renameWorkspace: (workspaceId: string, name: string) => void
  deleteWorkspace: (workspaceId: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: '',
      setActiveWorkspace: (workspaceId) => {
        if (get().workspaces.some((workspace) => workspace.id === workspaceId)) {
          set({ activeWorkspaceId: workspaceId })
        }
      },
      addWorkspace: (name) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do workspace é obrigatório.')
        const id = crypto.randomUUID()
        const slugBase = cleanName.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const slug = `${slugBase || 'workspace'}-${id.slice(0, 6)}`
        set((state) => ({
          workspaces: [...state.workspaces, { id, name: cleanName, slug }],
          activeWorkspaceId: id,
        }))
        return id
      },
      renameWorkspace: (workspaceId, name) => {
        const cleanName = name.trim()
        if (!cleanName) throw new Error('O nome do workspace é obrigatório.')
        const workspace = get().workspaces.find((item) => item.id === workspaceId)
        if (!workspace) return
        const slugBase = cleanName.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const slug = `${slugBase || 'workspace'}-${workspaceId.slice(0, 6)}`
        set((state) => ({
          workspaces: state.workspaces.map((item) => item.id === workspaceId ? { ...item, name: cleanName, slug } : item),
        }))
      },
      deleteWorkspace: (workspaceId) => {
        set((state) => {
          const workspaces = state.workspaces.filter((workspace) => workspace.id !== workspaceId)
          const activeWorkspaceId = state.activeWorkspaceId === workspaceId
            ? workspaces[0]?.id ?? ''
            : state.activeWorkspaceId
          return { workspaces, activeWorkspaceId }
        })
      },
    }),
    {
      name: '2sflow-workspaces',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

useWorkspaceStore.setState((state) => ({ ...state }))
