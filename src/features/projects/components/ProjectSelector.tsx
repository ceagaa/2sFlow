import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Dialog } from '../../../components/ui/Dialog'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Input } from '../../../components/ui/Input'
import { useKanbanStore } from '../../kanban/store/useKanbanStore'
import type { Project, StatusCategory, TaskStatus } from '../../kanban/types'
import { useProjectStore } from '../store/useProjectStore'
import { useWorkspaceStore } from '../../workspaces/store/useWorkspaceStore'

interface ProjectSelectorProps {
  workspaceId: string
}

interface SortableProjectProps {
  project: Project
  active: boolean
  taskStatuses: TaskStatus[]
  expanded: boolean
  renaming: boolean
  renameValue: string
  onSelect: () => void
  onToggleExpand: () => void
  onStartRename: () => void
  onRenameChange: (value: string) => void
  onRenameCommit: () => void
  onRenameCancel: () => void
  onMove: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const statusDotColors: Record<StatusCategory, string> = {
  todo: 'bg-zinc-500',
  in_progress: 'bg-blue-400',
  review: 'bg-amber-400',
  done: 'bg-green-400',
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`size-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
      fill="currentColor"
    >
      <path d="M4.5 2.5 8.5 6l-4 3.5z" />
    </svg>
  )
}

function ProjectStateIcon({ state }: { state: 'waiting' | 'in-progress' | 'done' }) {
  if (state === 'in-progress') {
    return (
      <svg aria-label="Em andamento" role="img" viewBox="0 0 16 16" className="size-4 shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m5 4-3 4 3 4m6-8 3 4-3 4M9.5 3l-3 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (state === 'done') {
    return (
      <svg aria-label="Concluído" role="img" viewBox="0 0 16 16" className="size-4 shrink-0 text-green-400" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3 8.25 3.25 3.25L13 4.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg aria-label="Aguardando" role="img" viewBox="0 0 16 16" className="size-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2.5h8M4 13.5h8M5 2.75c0 3.5 3 3.25 3 5.25s-3 1.75-3 5.25m6-10.5c0 3.5-3 3.25-3 5.25s3 1.75 3 5.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortableProject({
  project,
  active,
  taskStatuses,
  expanded,
  renaming,
  renameValue,
  onSelect,
  onToggleExpand,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onMove,
  onDuplicate,
  onDelete,
}: SortableProjectProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tasks = useKanbanStore((state) => state.tasks)
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === project.id && task.parentId === null),
    [project.id, tasks],
  )
  const sortedStatuses = useMemo(
    () => [...taskStatuses].sort((left, right) => left.position - right.position),
    [taskStatuses],
  )
  const taskState = useMemo(() => {
    if (projectTasks.length > 0 && projectTasks.every((task) =>
      taskStatuses.find((status) => status.id === task.statusId)?.category === 'done',
    )) return 'done'

    if (projectTasks.some((task) => {
      const category = taskStatuses.find((status) => status.id === task.statusId)?.category
      return category === 'in_progress' || category === 'review'
    })) return 'in-progress'

    return 'waiting'
  }, [projectTasks, taskStatuses])
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
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

  function renameProject() {
    setMenuOpen(false)
    onStartRename()
  }

  function moveProject() {
    setMenuOpen(false)
    onMove()
  }

  function deleteProject() {
    setMenuOpen(false)
    onDelete()
  }

  function duplicateProject() {
    setMenuOpen(false)
    onDuplicate()
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-md ${isDragging ? 'z-10 opacity-50' : ''}`}
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Recolher' : 'Expandir'} projeto ${project.name}`}
          title={expanded ? 'Recolher status' : 'Ver status'}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
        >
          <Chevron expanded={expanded} />
        </button>
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(event) => onRenameChange(event.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onRenameCommit()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                onRenameCancel()
              }
            }}
            aria-label={`Novo nome do projeto ${project.name}`}
            className="h-8 min-w-0 flex-1 rounded-md border border-zinc-600 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
        ) : (
          <button
            onClick={onSelect}
            onDoubleClick={onStartRename}
            aria-current={active ? 'page' : undefined}
            title={`${project.name} · duplo clique para renomear`}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
              active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <ProjectStateIcon state={taskState} />
            <span className="truncate">{project.name}</span>
          </button>
        )}
        <button
          type="button"
          aria-label={`Reorganizar projeto ${project.name}`}
          title="Arraste para reorganizar"
          className="rounded px-1.5 py-2 text-zinc-600 opacity-0 hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100 focus:opacity-100"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label={`Opções do projeto ${project.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Opções do projeto"
            className={`rounded px-1.5 py-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
              menuOpen ? 'bg-zinc-800 text-zinc-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              aria-label={`Opções do projeto ${project.name}`}
              className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
                onClick={renameProject}
              >
                Renomear
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
                onClick={moveProject}
              >
                Mover para workspace
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
                onClick={duplicateProject}
              >
                Duplicar
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
                onClick={deleteProject}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <ul
          aria-label={`Status do projeto ${project.name}`}
          className="mb-1 ml-4 mt-0.5 space-y-px border-l border-zinc-800 pl-1.5"
        >
          {sortedStatuses.map((status) => (
            <li key={status.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs text-zinc-500">
              <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${statusDotColors[status.category]}`} />
              <span className="truncate">{status.name}</span>
              <span className="ml-auto tabular-nums text-zinc-600">
                {projectTasks.filter((task) => task.statusId === status.id).length}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProjectSelector({ workspaceId }: ProjectSelectorProps) {
  const allProjects = useProjectStore((state) => state.projects)
  const projects = allProjects.filter((project) => project.workspaceId === workspaceId)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)
  const reorderProjects = useProjectStore((state) => state.reorderProjects)
  const allStatuses = useProjectStore((state) => state.statuses)
  const projectStatuses = allStatuses.filter((status) => projects.some((project) => project.id === status.projectId))
  const addProject = useProjectStore((state) => state.addProject)
  const renameProject = useProjectStore((state) => state.renameProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const duplicateProject = useProjectStore((state) => state.duplicateProject)
  const removeTasksForProject = useKanbanStore((state) => state.removeTasksForProject)
  const duplicateTasksForProject = useKanbanStore((state) => state.duplicateTasksForProject)
  const statusTemplates = useProjectStore((state) => state.statusTemplates)
  const transferProject = useProjectStore((state) => state.transferProject)
  const workspaces = useWorkspaceStore((state) => state.workspaces)
  const transferTasksForProject = useKanbanStore((state) => state.transferTasksForProject)
  const [sectionOpen, setSectionOpen] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [statusTemplateId, setStatusTemplateId] = useState('template-default')
  const [moveProjectId, setMoveProjectId] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameSessionRef = useRef<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const movingProject = allProjects.find((project) => project.id === moveProjectId)
  const targetWorkspaces = movingProject
    ? workspaces.filter((workspace) => workspace.id !== movingProject.workspaceId)
    : []

  function openCreateDialog() {
    setName('')
    setStatusTemplateId('template-default')
    setDialogOpen(true)
  }

  function startRename(project: Project) {
    renameSessionRef.current = project.id
    setRenamingProjectId(project.id)
    setRenameValue(project.name)
  }

  function commitRename() {
    const projectId = renameSessionRef.current
    if (!projectId) return
    renameSessionRef.current = null
    const trimmed = renameValue.trim()
    const project = allProjects.find((item) => item.id === projectId)
    if (project && trimmed && trimmed !== project.name) renameProject(projectId, trimmed)
    setRenamingProjectId(null)
    setRenameValue('')
  }

  function cancelRename() {
    renameSessionRef.current = null
    setRenamingProjectId(null)
    setRenameValue('')
  }

  function toggleExpand(projectId: string) {
    setExpandedIds((ids) =>
      ids.includes(projectId) ? ids.filter((id) => id !== projectId) : [...ids, projectId],
    )
  }

  function openMoveDialog(project: Project) {
    setMoveProjectId(project.id)
    setTargetWorkspaceId(workspaces.find((workspace) => workspace.id !== project.workspaceId)?.id ?? '')
  }

  function closeMoveDialog() {
    setMoveProjectId(null)
    setTargetWorkspaceId('')
  }

  function submitMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!moveProjectId || !targetWorkspaceId) return
    transferProject(moveProjectId, targetWorkspaceId)
    transferTasksForProject(moveProjectId, targetWorkspaceId)
    closeMoveDialog()
  }

  function removeProject(project: Project) {
    setProjectToDelete(project)
  }

  function duplicateProjectWithTasks(project: Project) {
    const duplicated = duplicateProject(project.id)
    if (!duplicated) return
    duplicateTasksForProject(
      project.id,
      duplicated.projectId,
      project.workspaceId,
      duplicated.statusIdMap,
    )
  }

  function confirmProjectDeletion() {
    if (!projectToDelete) return
    removeTasksForProject(projectToDelete.id)
    deleteProject(projectToDelete.id)
    setProjectToDelete(null)
  }

  function handleProjectDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = projects.findIndex((project) => project.id === active.id)
    const newIndex = projects.findIndex((project) => project.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    reorderProjects(workspaceId, arrayMove(projects, oldIndex, newIndex).map((project) => project.id))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !workspaceId) return
    addProject(workspaceId, name, statusTemplateId)
    setName('')
    setStatusTemplateId('template-default')
    setDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            type="button"
            onClick={() => setSectionOpen((open) => !open)}
            aria-expanded={sectionOpen}
            aria-label={sectionOpen ? 'Recolher lista de projetos' : 'Expandir lista de projetos'}
            title={sectionOpen ? 'Recolher projetos' : 'Expandir projetos'}
            className="flex items-center gap-1 rounded px-1 py-0.5 text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          >
            <Chevron expanded={sectionOpen} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projetos</span>
          </button>
          <button
            className="rounded px-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={openCreateDialog}
            aria-label="Criar projeto"
            title={workspaceId ? 'Criar projeto' : 'Crie primeiro um workspace'}
            disabled={!workspaceId}
          >
            +
          </button>
        </div>
        {sectionOpen && (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
              <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {projects.map((project) => (
                    <SortableProject
                      key={project.id}
                      project={project}
                      active={project.id === activeProjectId}
                      taskStatuses={projectStatuses.filter((status) => status.projectId === project.id)}
                      expanded={expandedIds.includes(project.id)}
                      renaming={renamingProjectId === project.id}
                      renameValue={renameValue}
                      onSelect={() => setActiveProject(project.id)}
                      onToggleExpand={() => toggleExpand(project.id)}
                      onStartRename={() => startRename(project)}
                      onRenameChange={setRenameValue}
                      onRenameCommit={commitRename}
                      onRenameCancel={cancelRename}
                      onMove={() => openMoveDialog(project)}
                      onDuplicate={() => duplicateProjectWithTasks(project)}
                      onDelete={() => removeProject(project)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {!workspaceId && <p className="px-2.5 py-2 text-xs text-zinc-500">Crie um workspace para começar.</p>}
            {workspaceId && !projects.length && <p className="px-2.5 py-2 text-xs text-zinc-500">Nenhum projeto neste workspace.</p>}
          </>
        )}
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Novo projeto"
      >
        <form onSubmit={submit} className="space-y-4">
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do projeto" aria-label="Nome do projeto" />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Modelo de status</span>
            <Dropdown
              aria-label="Modelo de status"
              value={statusTemplateId}
              onChange={(event) => setStatusTemplateId(event.target.value)}
              options={statusTemplates.map((template) => ({ value: template.id, label: template.name }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!name.trim() || !workspaceId}>
              Criar projeto
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(moveProjectId)}
        onClose={closeMoveDialog}
        title="Mover projeto"
        description={`Escolha o workspace de destino${movingProject ? ` de "${movingProject.name}"` : ''}.`}
      >
        <form onSubmit={submitMove} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Workspace de destino</span>
            <Dropdown
              aria-label="Workspace de destino"
              value={targetWorkspaceId}
              onChange={(event) => setTargetWorkspaceId(event.target.value)}
              options={targetWorkspaces.map((workspace) => ({ value: workspace.id, label: workspace.name }))}
              disabled={!targetWorkspaces.length}
            />
          </label>
          {!targetWorkspaces.length && (
            <p className="text-xs text-zinc-500">
              Você ainda tem apenas um workspace. Crie outro workspace para poder mover projetos entre eles.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeMoveDialog}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!targetWorkspaceId}>Mover projeto</Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title="Excluir projeto?"
        description={projectToDelete
          ? `O projeto “${projectToDelete.name}” e todas as tarefas e subtarefas dele serão excluídos permanentemente.`
          : ''}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmProjectDeletion}
      />
    </>
  )
}
