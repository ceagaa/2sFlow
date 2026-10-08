import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useWorkspaceStore } from '../../features/workspaces/store/useWorkspaceStore'
import { ProjectSelector } from '../../features/projects/components/ProjectSelector'
import { WorkspaceSwitcher } from '../../features/workspaces/components/WorkspaceSwitcher'

interface SidebarProps {
  collapsed: boolean
  authenticated: boolean
}

const SIDEBAR_MIN_WIDTH = 220
const SIDEBAR_MAX_WIDTH = 480
const SIDEBAR_DEFAULT_WIDTH = 264
const SIDEBAR_WIDTH_STORAGE_KEY = '2sflow-sidebar-width'
const RESIZE_STEP = 16

function clampWidth(width: number) {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)))
}

function readStoredWidth() {
  try {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY))
    if (localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY) !== null && Number.isFinite(stored)) return clampWidth(stored)
  } catch {
    return SIDEBAR_DEFAULT_WIDTH
  }
  return SIDEBAR_DEFAULT_WIDTH
}

export function Sidebar({ collapsed, authenticated }: SidebarProps) {
  const [width, setWidth] = useState(readStoredWidth)
  const widthRef = useRef(width)
  widthRef.current = width

  function applyWidth(nextWidth: number) {
    const clamped = clampWidth(nextWidth)
    widthRef.current = clamped
    setWidth(clamped)
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clamped))
    } catch {
      // localStorage indisponível: a largura vale só nesta sessão
    }
  }

  function handleResizeStart(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const startPointerX = event.clientX
    const startWidth = widthRef.current

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      applyWidth(startWidth + (moveEvent.clientX - startPointerX))
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      applyWidth(widthRef.current - RESIZE_STEP)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      applyWidth(widthRef.current + RESIZE_STEP)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      applyWidth(SIDEBAR_DEFAULT_WIDTH)
    }
  }

  return (
    <aside
      style={{ width: collapsed ? 0 : width }}
      className={`relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-200 ${
        collapsed ? 'overflow-hidden border-r-0' : ''
      }`}
    >
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
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar barra lateral"
          aria-valuenow={width}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          tabIndex={0}
          title="Arraste para redimensionar · setas ajustam · duplo clique restaura"
          onPointerDown={handleResizeStart}
          onDoubleClick={() => applyWidth(SIDEBAR_DEFAULT_WIDTH)}
          onKeyDown={handleResizeKeyDown}
          className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
        />
      )}
    </aside>
  )
}

function useActiveWorkspaceId() {
  return useWorkspaceStore((state) => state.activeWorkspaceId)
}
