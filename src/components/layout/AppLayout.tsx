import { useEffect, useState, type ReactNode } from 'react'
import { useProjectStore } from '../../features/projects/store/useProjectStore'
import { useWorkspaceStore } from '../../features/workspaces/store/useWorkspaceStore'
import { Header, type ThemeMode, type ViewMode } from './Header'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: (view: ViewMode) => ReactNode
  accountEmail?: string
  onSignOut?: () => void | Promise<void>
}

function readTheme(): ThemeMode {
  try {
    return localStorage.getItem('2sflow-theme') === 'light' ? 'light' : 'dark'
  } catch (error) {
    console.error('Falha ao carregar a preferência de tema:', error)
    return 'dark'
  }
}

export function AppLayout({ children, accountEmail, onSignOut }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [view, setView] = useState<ViewMode>('kanban')
  const [theme, setTheme] = useState<ThemeMode>(readTheme)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const activeWorkspace = useWorkspaceStore((state) => state.workspaces.find((workspace) => workspace.id === activeWorkspaceId))
  const projects = useProjectStore((state) => state.projects)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const workspaceProjects = projects.filter((project) => project.workspaceId === activeWorkspaceId)
  const activeProject = workspaceProjects.find((project) => project.id === activeProjectId) ?? workspaceProjects[0]

  useEffect(() => {
    if (activeProject && activeProject.id !== activeProjectId) setActiveProject(activeProject.id)
  }, [activeProject, activeProjectId, setActiveProject])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('2sflow-theme', theme)
    } catch (error) {
      console.error('Falha ao salvar a preferência de tema:', error)
    }
  }, [theme])

  return (
    <div className="flex h-screen min-h-[480px] overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar collapsed={sidebarCollapsed} authenticated={Boolean(accountEmail)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          workspace={activeWorkspace}
          project={activeProject}
          view={view}
          onViewChange={setView}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
          accountEmail={accountEmail}
          onSignOut={onSignOut}
        />
        <main className="min-h-0 flex-1 overflow-auto">{children(view)}</main>
      </div>
    </div>
  )
}
