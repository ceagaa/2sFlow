import { Button } from '../ui/Button'
import type { Project, Workspace } from '../../features/kanban/types'

export type ViewMode = 'kanban' | 'list'

interface HeaderProps {
  workspace?: Workspace
  project?: Project
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  onToggleSidebar: () => void
  accountEmail?: string
  onSignOut?: () => void | Promise<void>
}

export function Header({ workspace, project, view, onViewChange, onToggleSidebar, accountEmail, onSignOut }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Alternar sidebar" onClick={onToggleSidebar}>☰</Button>
        <div className="min-w-0 text-sm">
          <span className="text-zinc-500">{workspace?.name ?? 'Workspace'}</span>
          <span className="px-2 text-zinc-700">/</span>
          <span className="truncate font-medium text-zinc-100">{project?.name ?? 'Selecione um projeto'}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-1">
          <Button size="sm" variant={view === 'kanban' ? 'secondary' : 'ghost'} aria-pressed={view === 'kanban'} onClick={() => onViewChange('kanban')}>Kanban</Button>
          <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} aria-pressed={view === 'list'} onClick={() => onViewChange('list')}>Lista</Button>
        </div>
        {accountEmail && (
          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs text-zinc-500 lg:block">{accountEmail}</span>
            <Button size="sm" variant="ghost" onClick={() => void onSignOut?.()}>Sair</Button>
          </div>
        )}
      </div>
    </header>
  )
}
