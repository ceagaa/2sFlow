import { useWorkspaceStore } from '../../features/workspaces/store/useWorkspaceStore'
import { ProjectSelector } from '../../features/projects/components/ProjectSelector'
import { WorkspaceSwitcher } from '../../features/workspaces/components/WorkspaceSwitcher'

interface SidebarProps {
  collapsed: boolean
  authenticated: boolean
}

export function Sidebar({ collapsed, authenticated }: SidebarProps) {
  return (
    <aside className={`flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-200 ${collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'}`}>
      <div className="border-b border-zinc-800 p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-950">2s</div>
          <span className="text-sm font-semibold tracking-tight">2sFlow</span>
        </div>
        <WorkspaceSwitcher />
      </div>
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto p-3">
        <ProjectSelector workspaceId={useActiveWorkspaceId()} />
      </nav>
      <div className="border-t border-zinc-800 px-4 py-3 text-[11px] text-zinc-600">
        {authenticated ? 'Conta autenticada · dados no Supabase' : 'Workspace local · sincronização desativada'}
      </div>
    </aside>
  )
}

function useActiveWorkspaceId() {
  return useWorkspaceStore((state) => state.activeWorkspaceId)
}
