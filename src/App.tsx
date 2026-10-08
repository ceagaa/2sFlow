import { AppLayout } from './components/layout/AppLayout'
import { KanbanBoard } from './features/kanban/components/KanbanBoard'
import { ListView } from './features/kanban/components/ListView'
import { TaskModal } from './features/kanban/components/TaskModal'
import { Button } from './components/ui/Button'
import { StatusTemplateManager } from './features/projects/components/StatusTemplateManager'
import { useKanbanStore } from './features/kanban/store/useKanbanStore'
import { useProjectStore } from './features/projects/store/useProjectStore'
import { useWorkspaceStore } from './features/workspaces/store/useWorkspaceStore'
import { useState } from 'react'

interface AppProps {
  accountEmail?: string
  onSignOut?: () => void | Promise<void>
}

export default function App({ accountEmail, onSignOut }: AppProps) {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const projects = useProjectStore((state) => state.projects)
  const activeProject = projects.find((project) => project.id === activeProjectId)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const tasks = useKanbanStore((state) => state.tasks)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [statusManagerOpen, setStatusManagerOpen] = useState(false)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  return (
    <AppLayout accountEmail={accountEmail} onSignOut={onSignOut}>
      {(view) => (
        <>
          {activeProject
            ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-900 px-4 py-3 sm:px-6">
                  <div>
                    <h1 className="text-sm font-semibold">{activeProject.name}</h1>
                    <p className="mt-0.5 text-xs text-zinc-500">{tasks.filter((task) => task.projectId === activeProject.id && task.parentId === null).length} tarefas</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setStatusManagerOpen(true)}>Gerenciar status</Button>
                </div>
                <div className="min-h-0 flex-1">
                  {view === 'kanban'
                    ? <KanbanBoard workspaceId={activeWorkspaceId} projectId={activeProject.id} onTaskSelect={setSelectedTaskId} />
                    : <ListView workspaceId={activeWorkspaceId} projectId={activeProject.id} onTaskSelect={setSelectedTaskId} />}
                </div>
              </div>
            )
            : (
              <div className="p-6">
                <h1 className="text-sm font-medium text-zinc-200">
                  {activeWorkspaceId ? 'Nenhum projeto neste workspace' : 'Seu espaço está pronto'}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {activeWorkspaceId
                    ? 'Use o botão + em Projetos para criar seu primeiro projeto.'
                    : 'Crie um workspace na barra lateral para começar a organizar projetos e tarefas.'}
                </p>
              </div>
            )}
          <TaskModal task={selectedTask} onClose={() => setSelectedTaskId(null)} />
          {statusManagerOpen && activeProject && (
            <StatusTemplateManager projectId={activeProject.id} onClose={() => setStatusManagerOpen(false)} />
          )}
        </>
      )}
    </AppLayout>
  )
}
