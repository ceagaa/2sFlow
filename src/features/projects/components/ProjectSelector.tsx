import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Input } from '../../../components/ui/Input'
import { useKanbanStore } from '../../kanban/store/useKanbanStore'
import type { Project, TaskStatus } from '../../kanban/types'
import { useProjectStore } from '../store/useProjectStore'

interface ProjectSelectorProps {
  workspaceId: string
}

interface SortableProjectProps {
  project: Project
  active: boolean
  taskStatuses: TaskStatus[]
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
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

function SortableProject({ project, active, taskStatuses, onSelect, onEdit, onDelete }: SortableProjectProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tasks = useKanbanStore((state) => state.tasks)
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === project.id && task.parentId === null),
    [project.id, tasks],
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

  function editProject() {
    setMenuOpen(false)
    onEdit()
  }

  function deleteProject() {
    setMenuOpen(false)
    onDelete()
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-1 rounded-md ${isDragging ? 'z-10 opacity-50' : ''}`}
    >
      <button
        onClick={onSelect}
        aria-current={active ? 'page' : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
          active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
        }`}
      >
        <ProjectStateIcon state={taskState} />
        <span className="truncate">{project.name}</span>
      </button>
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
            className="absolute right-0 top-full z-30 mt-1 w-36 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center rounded px-2.5 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:outline-none"
              onClick={editProject}
            >
              Renomear
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
  const removeTasksForProject = useKanbanStore((state) => state.removeTasksForProject)
  const statusTemplates = useProjectStore((state) => state.statusTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [statusTemplateId, setStatusTemplateId] = useState('template-default')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function openCreateDialog() {
    setEditingProjectId(null)
    setName('')
    setStatusTemplateId('template-default')
    setDialogOpen(true)
  }

  function openEditDialog(project: Project) {
    setEditingProjectId(project.id)
    setName(project.name)
    setDialogOpen(true)
  }

  function removeProject(project: Project) {
    const confirmed = window.confirm(
      `Excluir o projeto "${project.name}"? Todas as tarefas e subtarefas dele também serão excluídas.`,
    )
    if (!confirmed) return
    removeTasksForProject(project.id)
    deleteProject(project.id)
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
    if (!name.trim()) return
    if (editingProjectId) {
      renameProject(editingProjectId, name)
    } else {
      addProject(workspaceId, name, statusTemplateId)
    }
    setName('')
    setEditingProjectId(null)
    setStatusTemplateId('template-default')
    setDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Projetos</span>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
          <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {projects.map((project) => (
                <SortableProject
                  key={project.id}
                  project={project}
                  active={project.id === activeProjectId}
                  taskStatuses={projectStatuses.filter((status) => status.projectId === project.id)}
                  onSelect={() => setActiveProject(project.id)}
                  onEdit={() => openEditDialog(project)}
                  onDelete={() => removeProject(project)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {!workspaceId && <p className="px-2.5 py-2 text-xs text-zinc-500">Crie um workspace para começar.</p>}
        {workspaceId && !projects.length && <p className="px-2.5 py-2 text-xs text-zinc-500">Nenhum projeto neste workspace.</p>}
      </div>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingProjectId ? 'Editar projeto' : 'Novo projeto'}
      >
        <form onSubmit={submit} className="space-y-4">
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do projeto" aria-label="Nome do projeto" />
          {!editingProjectId && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Modelo de status</span>
              <Dropdown
                aria-label="Modelo de status"
                value={statusTemplateId}
                onChange={(event) => setStatusTemplateId(event.target.value)}
                options={statusTemplates.map((template) => ({ value: template.id, label: template.name }))}
              />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!name.trim() || (!editingProjectId && !workspaceId)}>
              {editingProjectId ? 'Salvar' : 'Criar projeto'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
