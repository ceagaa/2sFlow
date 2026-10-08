import { useState, type FormEvent } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Input } from '../../../components/ui/Input'
import { useKanbanStore } from '../../kanban/store/useKanbanStore'
import type { TaskStatus } from '../../kanban/types'
import { useProjectStore } from '../store/useProjectStore'

interface StatusTemplateManagerProps {
  projectId: string
  onClose: () => void
}

const categories = [
  { value: 'todo', label: 'A fazer' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'review', label: 'Em revisão' },
  { value: 'done', label: 'Concluído' },
]

export function StatusTemplateManager({ projectId, onClose }: StatusTemplateManagerProps) {
  const allStatuses = useProjectStore((state) => state.statuses)
  const statuses = allStatuses.filter((status) => status.projectId === projectId).sort((left, right) => left.position - right.position)
  const statusTemplates = useProjectStore((state) => state.statusTemplates)
  const addStatus = useProjectStore((state) => state.addStatus)
  const renameStatus = useProjectStore((state) => state.renameStatus)
  const reorderStatuses = useProjectStore((state) => state.reorderStatuses)
  const removeStatus = useProjectStore((state) => state.removeStatus)
  const saveStatusTemplate = useProjectStore((state) => state.saveStatusTemplate)
  const tasks = useKanbanStore((state) => state.tasks)
  const moveTasksToStatus = useKanbanStore((state) => state.moveTasksToStatus)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<TaskStatus['category']>('todo')
  const [templateName, setTemplateName] = useState('')
  const [message, setMessage] = useState('')

  function createStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    addStatus(projectId, name, category)
    setName('')
    setMessage('')
  }

  function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!templateName.trim()) return
    try {
      saveStatusTemplate(projectId, templateName)
      setMessage(`Modelo "${templateName.trim()}" salvo e disponível para novos projetos.`)
      setTemplateName('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar o modelo.')
    }
  }

  function deleteStatus(status: TaskStatus) {
    if (statuses.length <= 1) return
    const replacement = statuses.find((candidate) => candidate.id !== status.id)
    if (!replacement) return
    const affectedTasks = tasks.filter((task) => task.statusId === status.id)
    if (affectedTasks.length) moveTasksToStatus(status.id, replacement.id)
    removeStatus(projectId, status.id)
  }

  function moveStatus(statusIndex: number, offset: -1 | 1) {
    const targetIndex = statusIndex + offset
    if (targetIndex < 0 || targetIndex >= statuses.length) return
    const orderedIds = statuses.map((status) => status.id)
    const [moved] = orderedIds.splice(statusIndex, 1)
    orderedIds.splice(targetIndex, 0, moved)
    reorderStatuses(projectId, orderedIds)
  }

  return (
    <Dialog open onClose={onClose} title="Status do projeto" description="Organize os grupos do Kanban e salve modelos para reutilização." className="max-h-[90vh] overflow-y-auto">
      <div className="space-y-5">
        <div className="space-y-2">
          {statuses.map((status, index) => (
            <div key={status.id} className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-2">
              <Input
                aria-label={`Nome do status ${status.name}`}
                defaultValue={status.name}
                onBlur={(event) => {
                  const value = event.currentTarget.value.trim()
                  if (value && value !== status.name) renameStatus(status.id, value)
                }}
                className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 focus:border-zinc-700"
              />
              <Badge variant="outline">{categories.find((item) => item.value === status.category)?.label}</Badge>
              <Button size="icon" variant="ghost" aria-label={`Mover ${status.name} para cima`} disabled={index === 0} onClick={() => moveStatus(index, -1)}>↑</Button>
              <Button size="icon" variant="ghost" aria-label={`Mover ${status.name} para baixo`} disabled={index === statuses.length - 1} onClick={() => moveStatus(index, 1)}>↓</Button>
              <Button size="icon" variant="ghost" aria-label={`Excluir status ${status.name}`} disabled={statuses.length <= 1} onClick={() => deleteStatus(status)}>×</Button>
            </div>
          ))}
        </div>

        <form onSubmit={createStatus} className="grid grid-cols-[1fr_145px_auto] gap-2 border-t border-zinc-800 pt-4">
          <Input aria-label="Nome do novo status" value={name} onChange={(event) => setName(event.target.value)} placeholder="Novo status" />
          <Dropdown
            aria-label="Categoria do novo status"
            value={category}
            onChange={(event) => setCategory(event.target.value as TaskStatus['category'])}
            options={categories}
          />
          <Button type="submit" disabled={!name.trim()}>Adicionar</Button>
        </form>

        <form onSubmit={saveTemplate} className="space-y-2 border-t border-zinc-800 pt-4">
          <label className="block text-xs font-medium text-zinc-400">Salvar como modelo reutilizável</label>
          <div className="flex gap-2">
            <Input aria-label="Nome do modelo" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Ex.: Fluxo de conteúdo" />
            <Button type="submit" disabled={!templateName.trim()}>Salvar modelo</Button>
          </div>
          <p className="text-xs text-zinc-500">{statusTemplates.length} modelo(s) disponíveis para novos projetos.</p>
          {message && <p role="status" className="text-xs text-zinc-300">{message}</p>}
        </form>

        <div className="flex justify-end border-t border-zinc-800 pt-4">
          <Button variant="primary" onClick={onClose}>Concluir</Button>
        </div>
      </div>
    </Dialog>
  )
}
