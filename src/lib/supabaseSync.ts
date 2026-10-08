import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Project, StatusTemplate, Task, TaskStatus, Workspace } from '../features/kanban/types'
import { useKanbanStore } from '../features/kanban/store/useKanbanStore'
import {
  defaultStatuses,
  defaultStatusTemplate,
  useProjectStore,
} from '../features/projects/store/useProjectStore'
import { useWorkspaceStore } from '../features/workspaces/store/useWorkspaceStore'
import type { Database } from './database.types'

type Client = SupabaseClient<Database>
const cacheOwnerKey = '2sflow-supabase-cache-owner'
const shadowStorageKey = (ownerId: string) => `2sflow-supabase-shadow:${ownerId}`
const legacyDemoCleanupKey = (ownerId: string) => `2sflow-demo-cleanup:${ownerId}`

export interface WorkspaceSnapshot {
  workspaces: Workspace[]
  projects: Project[]
  statuses: TaskStatus[]
  statusTemplates: StatusTemplate[]
  tasks: Task[]
}

export interface WorkspaceLoadResult {
  offline: boolean
}

export function getWorkspaceSnapshot(): WorkspaceSnapshot {
  const workspaceState = useWorkspaceStore.getState()
  const projectState = useProjectStore.getState()
  const kanbanState = useKanbanStore.getState()
  return {
    workspaces: workspaceState.workspaces,
    projects: projectState.projects,
    statuses: projectState.statuses,
    statusTemplates: projectState.statusTemplates,
    tasks: kanbanState.tasks,
  }
}

function failOnError(error: PostgrestError | null) {
  if (error) throw new Error(`Supabase: ${error.message}`)
}

async function readRows<T>(query: PromiseLike<{ data: T[] | null; error: PostgrestError | null }>) {
  const { data, error } = await query
  failOnError(error)
  return data ?? []
}

function getEmptySnapshot(): WorkspaceSnapshot {
  return {
    workspaces: [],
    projects: [],
    statuses: [],
    statusTemplates: [{ ...defaultStatusTemplate, statuses: defaultStatuses.map((status) => ({ ...status })) }],
    tasks: [],
  }
}

function removeLegacyDemoWorkspace(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  const demoWorkspaceId = 'workspace-2swebtech'
  const workspaces = snapshot.workspaces.filter((workspace) => workspace.id !== demoWorkspaceId)
  if (workspaces.length === snapshot.workspaces.length) return snapshot
  const projectIds = new Set(snapshot.projects.filter((project) => project.workspaceId === demoWorkspaceId).map((project) => project.id))
  return {
    ...snapshot,
    workspaces,
    projects: snapshot.projects.filter((project) => project.workspaceId !== demoWorkspaceId),
    statuses: snapshot.statuses.filter((status) => !projectIds.has(status.projectId)),
    tasks: snapshot.tasks.filter((task) => task.workspaceId !== demoWorkspaceId),
  }
}

function getShadowSnapshot(ownerId: string) {
  const raw = localStorage.getItem(shadowStorageKey(ownerId))
  return raw ? JSON.parse(raw) as WorkspaceSnapshot : null
}

function setShadowSnapshot(ownerId: string, snapshot: WorkspaceSnapshot) {
  localStorage.setItem(shadowStorageKey(ownerId), JSON.stringify(snapshot))
  localStorage.setItem(cacheOwnerKey, ownerId)
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function mergeItems<T extends { id: string }>(base: T[], local: T[], remote: T[], preserveLocalOrder = false) {
  const baseById = new Map(base.map((item) => [item.id, item]))
  const localById = new Map(local.map((item) => [item.id, item]))
  const mergedById = new Map(remote.map((item) => [item.id, item]))

  for (const item of base) {
    if (!localById.has(item.id)) mergedById.delete(item.id)
  }
  for (const item of local) {
    const baseItem = baseById.get(item.id)
    if (!baseItem || !sameValue(baseItem, item)) mergedById.set(item.id, item)
  }

  const localOrder = local.map((item) => item.id)
  const baseLocalOrder = base.map((item) => item.id).filter((id) => localById.has(id))
  const localOrderChanged = localOrder.filter((id) => baseById.has(id)).join('|') !== baseLocalOrder.join('|')
  const orderedIds = preserveLocalOrder && localOrderChanged
    ? [...localOrder, ...remote.map((item) => item.id)]
    : [...remote.map((item) => item.id), ...localOrder]
  const seenIds = new Set<string>()
  return orderedIds.flatMap((id) => {
    if (seenIds.has(id)) return []
    seenIds.add(id)
    const item = mergedById.get(id)
    return item ? [item] : []
  })
}

export function mergeWorkspaceSnapshots(
  base: WorkspaceSnapshot,
  local: WorkspaceSnapshot,
  remote: WorkspaceSnapshot,
): WorkspaceSnapshot {
  return {
    workspaces: mergeItems(base.workspaces, local.workspaces, remote.workspaces),
    projects: mergeItems(base.projects, local.projects, remote.projects, true),
    statuses: mergeItems(base.statuses, local.statuses, remote.statuses),
    statusTemplates: mergeItems(base.statusTemplates, local.statusTemplates, remote.statusTemplates),
    tasks: mergeItems(base.tasks, local.tasks, remote.tasks),
  }
}

export function isNetworkFailure(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  return error instanceof TypeError && /fetch|network|connection|offline/i.test(error.message)
}

function applyWorkspaceSnapshot(
  workspaces: Workspace[],
  projects: Project[],
  statuses: TaskStatus[],
  statusTemplates: StatusTemplate[],
  tasks: Task[],
) {
  const previousWorkspaceState = useWorkspaceStore.getState()
  const previousProjectState = useProjectStore.getState()
  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === previousWorkspaceState.activeWorkspaceId)
    ? previousWorkspaceState.activeWorkspaceId
    : workspaces[0]?.id ?? ''
  const workspaceProjects = projects.filter((project) => project.workspaceId === activeWorkspaceId)
  const activeProjectId = workspaceProjects.some((project) => project.id === previousProjectState.activeProjectId)
    ? previousProjectState.activeProjectId
    : workspaceProjects[0]?.id ?? ''

  useWorkspaceStore.setState({ workspaces, activeWorkspaceId })
  useProjectStore.setState({ projects, statuses, statusTemplates, activeProjectId })
  useKanbanStore.setState({ tasks })
}

async function fetchUserWorkspace(client: Client, ownerId: string): Promise<WorkspaceSnapshot> {
  const [workspaceRows, projectRows, statusRows, templateRows, templateStatusRows, taskRows] = await Promise.all([
    readRows(client.from('workspaces').select('*').eq('owner_id', ownerId)),
    readRows(client.from('projects').select('*').eq('owner_id', ownerId).order('position')),
    readRows(client.from('task_statuses').select('*').eq('owner_id', ownerId).order('position')),
    readRows(client.from('status_templates').select('*').eq('owner_id', ownerId)),
    readRows(client.from('template_statuses').select('*').eq('owner_id', ownerId).order('position')),
    readRows(client.from('tasks').select('*').eq('owner_id', ownerId).order('position')),
  ])

  const workspaces: Workspace[] = workspaceRows.map(({ id, name, slug }) => ({ id, name, slug }))
  const projects: Project[] = projectRows.map(({ id, workspace_id, name, status_template_id }) => ({
    id,
    workspaceId: workspace_id,
    name,
    statusTemplateId: status_template_id,
  }))
  const statuses: TaskStatus[] = statusRows.map(({ id, project_id, name, category, position }) => ({
    id,
    projectId: project_id,
    name,
    category,
    position,
  }))
  const templateStatusesById = new Map<string, StatusTemplate['statuses']>()
  for (const status of templateStatusRows) {
    const templateStatuses = templateStatusesById.get(status.template_id) ?? []
    templateStatuses.push({ name: status.name, category: status.category, position: status.position })
    templateStatusesById.set(status.template_id, templateStatuses)
  }
  const statusTemplates: StatusTemplate[] = templateRows.map((template) => ({
    id: template.id,
    name: template.name,
    statuses: (templateStatusesById.get(template.id) ?? []).sort((left, right) => left.position - right.position),
  }))
  const tasks: Task[] = taskRows.map((task) => ({
    id: task.id,
    workspaceId: task.workspace_id,
    projectId: task.project_id,
    statusId: task.status_id,
    parentId: task.parent_id,
    title: task.title,
    description: task.description ?? undefined,
    priority: task.priority,
    position: task.position,
    dueDate: task.due_date ?? undefined,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }))

  return {
    workspaces,
    projects,
    statuses,
    statusTemplates: statusTemplates.length
      ? statusTemplates
      : [{ ...defaultStatusTemplate, statuses: defaultStatuses.map((status) => ({ ...status })) }],
    tasks,
  }
}

export async function loadUserWorkspace(client: Client, ownerId: string): Promise<WorkspaceLoadResult> {
  const cacheBelongsToUser = localStorage.getItem(cacheOwnerKey) === ownerId
  try {
    if (localStorage.getItem(legacyDemoCleanupKey(ownerId)) !== 'done') {
      await deleteRows(client, 'workspaces', ownerId, ['workspace-2swebtech'])
      localStorage.setItem(legacyDemoCleanupKey(ownerId), 'done')
    }
    const remote = await fetchUserWorkspace(client, ownerId)
    if (remote.workspaces.length === 0) {
      const shadow = cacheBelongsToUser ? getShadowSnapshot(ownerId) : null
      const local = removeLegacyDemoWorkspace(getWorkspaceSnapshot())
      const safeShadow = shadow ? removeLegacyDemoWorkspace(shadow) : null
      const empty = getEmptySnapshot()
      const initialSnapshot = safeShadow
        ? {
            ...local,
            statusTemplates: local.statusTemplates.length ? local.statusTemplates : empty.statusTemplates,
          }
        : empty
      applyWorkspaceSnapshot(
        initialSnapshot.workspaces,
        initialSnapshot.projects,
        initialSnapshot.statuses,
        initialSnapshot.statusTemplates,
        initialSnapshot.tasks,
      )
      await saveUserWorkspace(client, ownerId, initialSnapshot, getEmptySnapshot())
      setShadowSnapshot(ownerId, initialSnapshot)
      return { offline: false }
    }

    const local = removeLegacyDemoWorkspace(getWorkspaceSnapshot())
    const cachedShadow = cacheBelongsToUser ? getShadowSnapshot(ownerId) : null
    const shadow = cachedShadow ? removeLegacyDemoWorkspace(cachedShadow) : null
    const snapshot = shadow
      ? mergeWorkspaceSnapshots(shadow, local, remote)
      : remote

    applyWorkspaceSnapshot(
      snapshot.workspaces,
      snapshot.projects,
      snapshot.statuses,
      snapshot.statusTemplates,
      snapshot.tasks,
    )
    if (!sameValue(snapshot, remote)) await saveUserWorkspace(client, ownerId, snapshot, remote)
    setShadowSnapshot(ownerId, snapshot)
    return { offline: false }
  } catch (error) {
    if (!isNetworkFailure(error)) throw error
    if (!cacheBelongsToUser) {
      const empty = getEmptySnapshot()
      applyWorkspaceSnapshot(empty.workspaces, empty.projects, empty.statuses, empty.statusTemplates, empty.tasks)
    } else {
      const local = removeLegacyDemoWorkspace(getWorkspaceSnapshot())
      applyWorkspaceSnapshot(local.workspaces, local.projects, local.statuses, local.statusTemplates, local.tasks)
    }
    const local = getWorkspaceSnapshot()
    if (!getShadowSnapshot(ownerId)) setShadowSnapshot(ownerId, removeLegacyDemoWorkspace(local))
    return { offline: true }
  }
}

async function finishQuery(query: PromiseLike<{ error: PostgrestError | null }>) {
  const { error } = await query
  failOnError(error)
}

async function deleteRows(
  client: Client,
  table: 'tasks' | 'task_statuses' | 'projects' | 'template_statuses' | 'status_templates' | 'workspaces',
  ownerId: string,
  ids: string[],
) {
  if (ids.length === 0) return
  await finishQuery(client.from(table).delete().eq('owner_id', ownerId).in('id', ids))
}

function removedIds<T extends { id: string }>(previous: T[], next: T[]) {
  const nextIds = new Set(next.map((item) => item.id))
  return previous.filter((item) => !nextIds.has(item.id)).map((item) => item.id)
}

function getTemplateStatusRows(templates: StatusTemplate[], ownerId: string) {
  return templates.flatMap((template) =>
    template.statuses.map((status, index) => ({
      owner_id: ownerId,
      id: `${template.id}:${index}`,
      template_id: template.id,
      name: status.name,
      category: status.category,
      position: index,
    })),
  )
}

export async function saveUserWorkspace(
  client: Client,
  ownerId: string,
  snapshot: WorkspaceSnapshot,
  previous: WorkspaceSnapshot,
) {
  const workspaceRows = snapshot.workspaces.map((workspace) => ({ ...workspace, owner_id: ownerId }))
  const templateRows = snapshot.statusTemplates.map((template) => ({
    owner_id: ownerId,
    id: template.id,
    name: template.name,
  }))
  const templateStatusRows = getTemplateStatusRows(snapshot.statusTemplates, ownerId)
  const previousTemplateStatusRows = getTemplateStatusRows(previous.statusTemplates, ownerId)
  const projectPositions = new Map<string, number>()
  const projectRows = snapshot.projects.map((project) => {
    const position = projectPositions.get(project.workspaceId) ?? 0
    projectPositions.set(project.workspaceId, position + 1)
    return {
      owner_id: ownerId,
      id: project.id,
      workspace_id: project.workspaceId,
      name: project.name,
      status_template_id: project.statusTemplateId,
      position,
    }
  })
  const statusRows = snapshot.statuses.map((status) => ({
    owner_id: ownerId,
    id: status.id,
    project_id: status.projectId,
    name: status.name,
    category: status.category,
    position: status.position,
  }))
  const taskRows = snapshot.tasks.map((task) => ({
    owner_id: ownerId,
    id: task.id,
    workspace_id: task.workspaceId,
    project_id: task.projectId,
    status_id: task.statusId,
    parent_id: task.parentId,
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    position: task.position,
    due_date: task.dueDate ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }))

  if (workspaceRows.length) await finishQuery(client.from('workspaces').upsert(workspaceRows, { onConflict: 'owner_id,id' }))
  if (templateRows.length) await finishQuery(client.from('status_templates').upsert(templateRows, { onConflict: 'owner_id,id' }))
  if (templateStatusRows.length) await finishQuery(client.from('template_statuses').upsert(templateStatusRows, { onConflict: 'owner_id,id' }))
  if (projectRows.length) await finishQuery(client.from('projects').upsert(projectRows, { onConflict: 'owner_id,id' }))
  if (statusRows.length) await finishQuery(client.from('task_statuses').upsert(statusRows, { onConflict: 'owner_id,id' }))
  if (taskRows.length) await finishQuery(client.from('tasks').upsert(taskRows, { onConflict: 'owner_id,id' }))
  await deleteRows(client, 'tasks', ownerId, removedIds(previous.tasks, snapshot.tasks))
  await deleteRows(client, 'task_statuses', ownerId, removedIds(previous.statuses, snapshot.statuses))
  await deleteRows(client, 'projects', ownerId, removedIds(previous.projects, snapshot.projects))
  await deleteRows(client, 'template_statuses', ownerId, removedIds(previousTemplateStatusRows, templateStatusRows))
  await deleteRows(client, 'status_templates', ownerId, removedIds(previous.statusTemplates, snapshot.statusTemplates))
  await deleteRows(client, 'workspaces', ownerId, removedIds(previous.workspaces, snapshot.workspaces))
}

export function persistShadowSnapshot(ownerId: string, snapshot: WorkspaceSnapshot) {
  setShadowSnapshot(ownerId, snapshot)
}

export function subscribeWorkspaceStores(listener: () => void) {
  const unsubscribeWorkspace = useWorkspaceStore.subscribe((state, previous) => {
    if (state.workspaces !== previous.workspaces) listener()
  })
  const unsubscribeProjects = useProjectStore.subscribe((state, previous) => {
    if (
      state.projects !== previous.projects
      || state.statuses !== previous.statuses
      || state.statusTemplates !== previous.statusTemplates
    ) listener()
  })
  const unsubscribeTasks = useKanbanStore.subscribe((state, previous) => {
    if (state.tasks !== previous.tasks) listener()
  })

  return () => {
    unsubscribeWorkspace()
    unsubscribeProjects()
    unsubscribeTasks()
  }
}
