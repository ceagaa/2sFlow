import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Dialog } from '../../../components/ui/Dialog'
import { Input } from '../../../components/ui/Input'
import { useKanbanStore } from '../../kanban/store/useKanbanStore'
import { useProjectStore } from '../../projects/store/useProjectStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'

type DialogMode = 'create' | 'rename'

export function WorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId)
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace)
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace)
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace)
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace)
  const removeProjectsForWorkspace = useProjectStore((state) => state.removeProjectsForWorkspace)
  const removeTasksForWorkspace = useKanbanStore((state) => state.removeTasksForWorkspace)
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [workspaceToDeleteId, setWorkspaceToDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const workspaceToDelete = workspaces.find((workspace) => workspace.id === workspaceToDeleteId)

  function openDialog(mode: DialogMode) {
    setDialogMode(mode)
    setName(mode === 'rename' ? activeWorkspace?.name ?? '' : '')
    setDialogOpen(true)
    setMenuOpen(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    if (dialogMode === 'rename' && activeWorkspace) {
      renameWorkspace(activeWorkspace.id, cleanName)
    } else {
      addWorkspace(cleanName)
    }
    setName('')
    setDialogOpen(false)
  }

  function removeActiveWorkspace() {
    if (!activeWorkspace) return
    setWorkspaceToDeleteId(activeWorkspace.id)
    setMenuOpen(false)
  }

  function confirmWorkspaceDeletion() {
    if (!workspaceToDelete) return
    removeTasksForWorkspace(workspaceToDelete.id)
    removeProjectsForWorkspace(workspaceToDelete.id)
    deleteWorkspace(workspaceToDelete.id)
    setWorkspaceToDeleteId(null)
  }

  return (
    <>
      <div className="flex gap-1">
        <select
          aria-label="Workspace ativo"
          value={activeWorkspaceId}
          onChange={(event) => setActiveWorkspace(event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        >
          {!workspaces.length && <option value="">Nenhum workspace</option>}
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>
        {activeWorkspace && (
          <div className="relative">
            <Button
              size="icon"
              aria-label="Opções do workspace"
              aria-expanded={menuOpen}
              title="Opções do workspace"
              onClick={() => setMenuOpen((open) => !open)}
            >
              ⋯
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-40 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl">
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => openDialog('rename')}
                >
                  Renomear workspace
                </button>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={removeActiveWorkspace}
                >
                  Excluir workspace
                </button>
              </div>
            )}
          </div>
        )}
        <Button size="icon" aria-label="Criar workspace" title="Criar workspace" onClick={() => openDialog('create')}>+</Button>
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === 'create' ? 'Novo workspace' : 'Renomear workspace'}
      >
        <form onSubmit={submit} className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do workspace"
            aria-label="Nome do workspace"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>
              {dialogMode === 'create' ? 'Criar workspace' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(workspaceToDelete)}
        title="Excluir workspace?"
        description={workspaceToDelete
          ? `O workspace “${workspaceToDelete.name}”, seus projetos e todas as tarefas associadas serão excluídos permanentemente.`
          : ''}
        onCancel={() => setWorkspaceToDeleteId(null)}
        onConfirm={confirmWorkspaceDeletion}
      />
    </>
  )
}
