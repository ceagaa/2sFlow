import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Dialog } from '../../../components/ui/Dialog'
import { DatePicker } from '../../../components/ui/DatePicker'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Input } from '../../../components/ui/Input'
import { useProjectStore } from '../../projects/store/useProjectStore'
import { useKanbanStore } from '../store/useKanbanStore'
import type { Task, TaskPriority } from '../types'

interface TaskModalProps {
  task: Task | undefined
  onClose: () => void
}

const priorities = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function TaskModal({ task, onClose }: TaskModalProps) {
  const allTasks = useKanbanStore((state) => state.tasks)
  const addTask = useKanbanStore((state) => state.addTask)
  const updateTask = useKanbanStore((state) => state.updateTask)
  const deleteTask = useKanbanStore((state) => state.deleteTask)
  const allStatuses = useProjectStore((state) => state.statuses)
  const statuses = allStatuses.filter((status) => status.projectId === task?.projectId)
  const subtasks = allTasks.filter((candidate) => candidate.parentId === task?.id).sort((a, b) => a.position - b.position)
  const doneStatus = statuses.find((status) => status.category === 'done')
  const todoStatus = statuses.find((status) => status.category === 'todo')
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [newSubtask, setNewSubtask] = useState('')
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  useEffect(() => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setPriority(task?.priority ?? 'medium')
    setDueDate(task?.dueDate ?? '')
  }, [task])

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!task || !title.trim()) return
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    })
    onClose()
  }

  function createSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!task || !newSubtask.trim()) return
    addTask({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      statusId: task.statusId,
      parentId: task.id,
      title: newSubtask,
    })
    setNewSubtask('')
  }

  function toggleSubtask(subtask: Task, complete: boolean) {
    const destination = complete ? doneStatus : todoStatus
    if (destination) updateTask(subtask.id, { statusId: destination.id })
  }

  function removeTask() {
    if (!task) return
    setTaskToDelete(task)
  }

  function confirmTaskDeletion() {
    if (!taskToDelete) return
    deleteTask(taskToDelete.id)
    if (taskToDelete.id === task?.id) onClose()
    setTaskToDelete(null)
  }

  return (
    <>
      <Dialog
        open={Boolean(task)}
        onClose={onClose}
        title="Detalhes da tarefa"
        description="Edite as informações e acompanhe as subtarefas."
        className="max-h-[90vh] overflow-y-auto"
      >
        {task && (
        <div className="space-y-5">
          <form id="task-details-form" onSubmit={save} className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Título</span>
              <Input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Descrição</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Adicione contexto à tarefa..."
                className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="block text-xs font-medium text-zinc-400">Prioridade</span>
                <Dropdown
                  aria-label="Prioridade"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  options={priorities}
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-medium text-zinc-400">Data de entrega</span>
                <DatePicker
                  label="Selecionar data de entrega"
                  value={dueDate}
                  onChange={setDueDate}
                />
              </label>
            </div>
          </form>

          <section className="border-t border-zinc-800 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Subtarefas</h3>
              <Badge variant="outline">{subtasks.filter((subtask) => statuses.find((status) => status.id === subtask.statusId)?.category === 'done').length}/{subtasks.length}</Badge>
            </div>
            <div className="space-y-1">
              {subtasks.map((subtask) => {
                const complete = statuses.find((status) => status.id === subtask.statusId)?.category === 'done'
                return (
                  <div key={subtask.id} className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={complete}
                      disabled={!doneStatus || !todoStatus}
                      onChange={(event) => toggleSubtask(subtask, event.target.checked)}
                      aria-label={`Concluir ${subtask.title}`}
                      className="size-4 accent-zinc-200"
                    />
                    <span className={`min-w-0 flex-1 text-sm ${complete ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{subtask.title}</span>
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(subtask)}
                      aria-label={`Excluir ${subtask.title}`}
                      className="rounded px-1.5 text-zinc-600 opacity-0 hover:bg-zinc-800 hover:text-zinc-200 group-hover:opacity-100 focus:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
              {!subtasks.length && <p className="py-2 text-xs text-zinc-500">Ainda não há subtarefas.</p>}
            </div>
            <form onSubmit={createSubtask} className="mt-3 flex gap-2">
              <Input
                aria-label="Nome da subtarefa"
                value={newSubtask}
                onChange={(event) => setNewSubtask(event.target.value)}
                placeholder="+ Adicionar subtarefa"
              />
              <Button type="submit" disabled={!newSubtask.trim()}>Adicionar</Button>
            </form>
          </section>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100" onClick={removeTask}>Excluir tarefa</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" type="submit" form="task-details-form" disabled={!title.trim()}>Salvar</Button>
            </div>
          </div>
        </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Excluir tarefa?"
        description={taskToDelete
          ? `“${taskToDelete.title}”${taskToDelete.parentId ? ' e suas subtarefas' : ' e todas as subtarefas'} serão excluídas permanentemente.`
          : ''}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={confirmTaskDeletion}
      />
    </>
  )
}
