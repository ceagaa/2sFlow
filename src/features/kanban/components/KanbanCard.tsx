import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DatePicker } from '../../../components/ui/DatePicker'
import { Dialog } from '../../../components/ui/Dialog'
import { Dropdown } from '../../../components/ui/Dropdown'
import { useProjectStore } from '../../projects/store/useProjectStore'
import { useWorkspaceStore } from '../../workspaces/store/useWorkspaceStore'
import { useKanbanStore } from '../store/useKanbanStore'

interface KanbanCardProps {
  task: Task
  subtasks: Task[]
  completedSubtaskCount: number
  completed: boolean
  onSelect: (taskId: string) => void
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

const priorities = [
  { value: 'low', label: 'Baixa', description: 'Pode esperar um pouco', color: 'bg-zinc-400', text: 'text-zinc-300' },
  { value: 'medium', label: 'Média', description: 'Prioridade normal', color: 'bg-sky-400', text: 'text-sky-300' },
  { value: 'high', label: 'Alta', description: 'Precisa de atenção', color: 'bg-amber-400', text: 'text-amber-300' },
  { value: 'urgent', label: 'Urgente', description: 'Resolva o quanto antes', color: 'bg-red-400', text: 'text-red-300' },
] as const

export function KanbanCard({ task, subtasks, completedSubtaskCount, completed, onSelect }: KanbanCardProps) {
  const updateTask = useKanbanStore((state) => state.updateTask)
  const duplicateTask = useKanbanStore((state) => state.duplicateTask)
  const deleteTask = useKanbanStore((state) => state.deleteTask)
  const transferTasksToProject = useKanbanStore((state) => state.transferTasksToProject)
  const allTasks = useKanbanStore((state) => state.tasks)
  const projects = useProjectStore((state) => state.projects)
  const statuses = useProjectStore((state) => state.statuses)
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const [menuOpen, setMenuOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [targetProjectId, setTargetProjectId] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const priorityMenuRef = useRef<HTMLDivElement>(null)
  const priorityPopoverRef = useRef<HTMLDivElement>(null)
  const [priorityMenuPosition, setPriorityMenuPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
  const transferProjects = projects.filter((project) => project.id !== task.projectId)
  const targetProject = projects.find((project) => project.id === targetProjectId)
  const targetStatuses = statuses.filter((status) => status.projectId === targetProjectId)
  const currentPriority = priorities.find((priority) => priority.value === task.priority) ?? priorities[1]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { statusId: task.statusId },
  })

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!priorityMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node
        && !priorityMenuRef.current?.contains(event.target)
        && !priorityPopoverRef.current?.contains(event.target)
      ) {
        setPriorityMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPriorityMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [priorityMenuOpen])

  useLayoutEffect(() => {
    if (!priorityMenuOpen) {
      setPriorityMenuPosition(null)
      return
    }

    function updatePosition() {
      const anchor = priorityMenuRef.current?.getBoundingClientRect()
      const popover = priorityPopoverRef.current?.getBoundingClientRect()
      if (!anchor || !popover) return

      const top = anchor.bottom + 6
      const left = Math.max(8, Math.min(anchor.left, window.innerWidth - popover.width - 8))
      setPriorityMenuPosition({
        top,
        left,
        maxHeight: Math.max(80, window.innerHeight - top - 8),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [priorityMenuOpen])

  function duplicate() {
    setMenuOpen(false)
    duplicateTask(task.id)
  }

  function openDeleteDialog() {
    setMenuOpen(false)
    setDeleteDialogOpen(true)
  }

  function openTransferDialog() {
    setMenuOpen(false)
    setTargetProjectId(transferProjects[0]?.id ?? '')
    setTransferDialogOpen(true)
  }

  function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!targetProject || !targetStatuses.length) return

    const taskIds = new Set([task.id])
    let foundDescendant = true
    while (foundDescendant) {
      foundDescendant = false
      for (const candidate of allTasks) {
        if (candidate.parentId && taskIds.has(candidate.parentId) && !taskIds.has(candidate.id)) {
          taskIds.add(candidate.id)
          foundDescendant = true
        }
      }
    }

    const sourceStatuses = statuses.filter((status) => status.projectId === task.projectId)
    const statusIdMap = new Map(
      sourceStatuses.flatMap((sourceStatus) => {
        const targetStatus = targetStatuses.find((status) => status.category === sourceStatus.category)
          ?? targetStatuses[0]
        return targetStatus ? [[sourceStatus.id, targetStatus.id] as const] : []
      }),
    )
    transferTasksToProject([...taskIds], targetProject.id, targetProject.workspaceId, statusIdMap)
    setTransferDialogOpen(false)
  }

  const menuItemClassName = 'flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none'

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative w-full rounded-md border border-zinc-800 bg-zinc-800 p-3 text-left shadow-sm transition-colors hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${datePickerOpen || priorityMenuOpen ? 'z-50' : ''} ${isDragging ? 'z-10 opacity-50' : ''}`}
      {...attributes}
      {...listeners}
      role="group"
      aria-label={task.title}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          onClick={() => onSelect(task.id)}
        >
          <span className="text-sm font-medium leading-5 text-zinc-100">{task.title}</span>
          {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{task.description}</p>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={`Opções da tarefa ${task.title}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Opções da tarefa"
              onClick={(event) => {
                event.stopPropagation()
                setMenuOpen((open) => !open)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={`grid size-6 place-items-center rounded text-sm leading-none text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                menuOpen ? 'bg-zinc-800 text-zinc-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              }`}
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label={`Opções da tarefa ${task.title}`}
                className="absolute right-0 top-full z-30 mt-1 w-36 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={duplicate}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={menuItemClassName}
                >
                  Duplicar tarefa
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openDeleteDialog}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={menuItemClassName}
                >
                  Excluir tarefa
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openTransferDialog}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={menuItemClassName}
                >
                  Transferir tarefa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <DatePicker
            compact
            label="Definir data de entrega"
            value={task.dueDate ?? ''}
            completed={completed}
            onOpenChange={setDatePickerOpen}
            onChange={(dueDate) => updateTask(task.id, { dueDate: dueDate || undefined })}
          />
          <div ref={priorityMenuRef} className="relative">
            <button
              type="button"
              aria-label={`Prioridade: ${priorityLabels[task.priority]}. Alterar prioridade de ${task.title}`}
              aria-haspopup="menu"
              aria-expanded={priorityMenuOpen}
              onClick={() => setPriorityMenuOpen((open) => !open)}
              onPointerDown={(event) => event.stopPropagation()}
              className={`inline-flex h-7 items-center gap-1.5 rounded-md border border-transparent px-2 text-[11px] font-medium transition-colors hover:border-zinc-700 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${currentPriority.text}`}
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${currentPriority.color}`} />
              {currentPriority.label}
              <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {priorityMenuOpen && (
              createPortal(
                <div
                  ref={priorityPopoverRef}
                  role="menu"
                  aria-label={`Prioridade de ${task.title}`}
                  style={priorityMenuPosition
                    ? { top: priorityMenuPosition.top, left: priorityMenuPosition.left, maxHeight: priorityMenuPosition.maxHeight }
                    : { top: 0, left: 0, visibility: 'hidden' }}
                  className="priority-menu-enter fixed z-[1000] w-52 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl"
                >
                  {priorities.map((priority) => {
                    const selected = priority.value === task.priority
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          updateTask(task.id, { priority: priority.value })
                          setPriorityMenuOpen(false)
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-150 hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none ${
                          selected ? 'bg-zinc-800/70' : ''
                        }`}
                      >
                        <span className={`grid size-6 shrink-0 place-items-center rounded-md bg-zinc-800 ${priority.text}`}>
                          <span aria-hidden="true" className={`size-2 rounded-full ${priority.color}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-medium ${priority.text}`}>{priority.label}</span>
                          <span className="mt-0.5 block text-[10px] text-zinc-500">{priority.description}</span>
                        </span>
                        {selected && <span aria-hidden="true" className={`text-xs ${priority.text}`}>✓</span>}
                      </button>
                    )
                  })}
                </div>,
                document.body,
              )
            )}
          </div>
        </div>
        {subtasks.length > 0 && <span className="text-[11px] tabular-nums text-zinc-500">{completedSubtaskCount}/{subtasks.length}</span>}
      </div>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Excluir tarefa?"
        description={`“${task.title}” e todas as subtarefas serão excluídas permanentemente.`}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteTask(task.id)
          setDeleteDialogOpen(false)
        }}
      />
      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        title="Transferir tarefa"
        description={`A tarefa “${task.title}” e suas subtarefas serão movidas para o projeto escolhido.`}
      >
        <form onSubmit={submitTransfer} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Projeto de destino</span>
            <Dropdown
              aria-label="Projeto de destino"
              value={targetProjectId}
              onChange={(event) => setTargetProjectId(event.target.value)}
              options={transferProjects.map((project) => {
                const workspaceName = workspaces.find((workspace) => workspace.id === project.workspaceId)?.name ?? 'Workspace'
                return { value: project.id, label: `${workspaceName} / ${project.name}` }
              })}
              disabled={!transferProjects.length}
            />
          </label>
          {(!transferProjects.length || (targetProjectId && !targetStatuses.length)) && (
            <p className="text-xs text-zinc-500">
              {!transferProjects.length
                ? 'Não há outro projeto disponível. Crie um projeto em qualquer workspace para transferir.'
                : 'O projeto de destino não possui status configurados.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTransferDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!targetProject || !targetStatuses.length}>
              Transferir
            </Button>
          </div>
        </form>
      </Dialog>
    </article>
  )
}
