import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useKanbanStore } from '../store/useKanbanStore'

interface CreateTaskInlineProps {
  workspaceId: string
  projectId: string
  statusId: string
}

export function CreateTaskInline({ workspaceId, projectId, statusId }: CreateTaskInlineProps) {
  const addTask = useKanbanStore((state) => state.addTask)
  const [title, setTitle] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    addTask({ workspaceId, projectId, statusId, title })
    setTitle('')
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-1.5">
      <Input
        aria-label="Nova tarefa"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="+ Nova tarefa"
        className="h-8 border-transparent bg-transparent px-2 text-xs hover:border-zinc-800 focus:border-zinc-700"
      />
      {title.trim() && <Button size="sm" variant="secondary" type="submit" className="h-8 px-2">Adicionar</Button>}
    </form>
  )
}
