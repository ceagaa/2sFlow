-- Run this script in the Supabase SQL Editor.
-- Application access is restricted to authenticated users and their own rows.

create table if not exists public.workspaces (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (length(trim(slug)) > 0),
  created_at timestamptz not null default now(),
  primary key (owner_id, id),
  unique (owner_id, slug)
);

create table if not exists public.status_templates (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) > 0),
  primary key (owner_id, id)
);

create table if not exists public.template_statuses (
  owner_id uuid not null default auth.uid(),
  id text not null,
  template_id text not null,
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('todo', 'in_progress', 'review', 'done')),
  position integer not null check (position >= 0),
  primary key (owner_id, id),
  unique (owner_id, template_id, position),
  foreign key (owner_id, template_id)
    references public.status_templates (owner_id, id) on delete cascade
);

create table if not exists public.projects (
  owner_id uuid not null default auth.uid(),
  id text not null,
  workspace_id text not null,
  name text not null check (length(trim(name)) > 0),
  status_template_id text not null,
  position integer not null default 0 check (position >= 0),
  primary key (owner_id, id),
  unique (owner_id, workspace_id, id),
  foreign key (owner_id, workspace_id)
    references public.workspaces (owner_id, id) on delete cascade,
  foreign key (owner_id, status_template_id)
    references public.status_templates (owner_id, id) on delete restrict
);

create table if not exists public.task_statuses (
  owner_id uuid not null default auth.uid(),
  id text not null,
  project_id text not null,
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('todo', 'in_progress', 'review', 'done')),
  position integer not null check (position >= 0),
  primary key (owner_id, id),
  unique (owner_id, project_id, id),
  unique (owner_id, project_id, position),
  foreign key (owner_id, project_id)
    references public.projects (owner_id, id) on delete cascade
);

create table if not exists public.tasks (
  owner_id uuid not null default auth.uid(),
  id text not null,
  workspace_id text not null,
  project_id text not null,
  status_id text not null,
  parent_id text,
  title text not null check (length(trim(title)) > 0),
  description text,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  position integer not null default 0 check (position >= 0),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint tasks_owner_project_id_key unique (owner_id, project_id, id),
  foreign key (owner_id, workspace_id)
    references public.workspaces (owner_id, id) on delete cascade,
  foreign key (owner_id, workspace_id, project_id)
    references public.projects (owner_id, workspace_id, id) on delete cascade,
  foreign key (owner_id, project_id, status_id)
    references public.task_statuses (owner_id, project_id, id) on delete restrict,
  constraint tasks_parent_task_fkey foreign key (owner_id, project_id, parent_id)
    references public.tasks (owner_id, project_id, id) on delete cascade,
  check (parent_id is null or parent_id <> id)
);

-- Make reruns repair an existing tasks table created before the parent-task key existed.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_owner_project_id_key'
  ) then
    alter table public.tasks
      add constraint tasks_owner_project_id_key unique (owner_id, project_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_parent_task_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_parent_task_fkey
      foreign key (owner_id, project_id, parent_id)
      references public.tasks (owner_id, project_id, id)
      on delete cascade;
  end if;
end;
$$;

create index if not exists projects_workspace_position_idx
  on public.projects (owner_id, workspace_id, position);
create index if not exists task_statuses_project_position_idx
  on public.task_statuses (owner_id, project_id, position);
create index if not exists tasks_project_status_position_idx
  on public.tasks (owner_id, project_id, status_id, position);
create index if not exists tasks_parent_idx
  on public.tasks (owner_id, parent_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.status_templates enable row level security;
alter table public.template_statuses enable row level security;
alter table public.projects enable row level security;
alter table public.task_statuses enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Users manage their own workspaces" on public.workspaces;
create policy "Users manage their own workspaces"
  on public.workspaces for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users manage their own status templates" on public.status_templates;
create policy "Users manage their own status templates"
  on public.status_templates for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users manage their own template statuses" on public.template_statuses;
create policy "Users manage their own template statuses"
  on public.template_statuses for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users manage projects in their workspaces" on public.projects;
create policy "Users manage projects in their workspaces"
  on public.projects for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.workspaces w
      where w.owner_id = (select auth.uid())
        and w.id = projects.workspace_id
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.workspaces w
      where w.owner_id = (select auth.uid())
        and w.id = projects.workspace_id
    )
  );

drop policy if exists "Users manage statuses in their projects" on public.task_statuses;
create policy "Users manage statuses in their projects"
  on public.task_statuses for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      join public.workspaces w on w.owner_id = p.owner_id and w.id = p.workspace_id
      where p.owner_id = (select auth.uid())
        and p.id = task_statuses.project_id
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      join public.workspaces w on w.owner_id = p.owner_id and w.id = p.workspace_id
      where p.owner_id = (select auth.uid())
        and p.id = task_statuses.project_id
    )
  );

drop policy if exists "Users manage tasks in their projects" on public.tasks;
create policy "Users manage tasks in their projects"
  on public.tasks for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      join public.workspaces w on w.owner_id = p.owner_id and w.id = p.workspace_id
      where p.owner_id = (select auth.uid())
        and p.id = tasks.project_id
        and w.id = tasks.workspace_id
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      join public.workspaces w on w.owner_id = p.owner_id and w.id = p.workspace_id
      where p.owner_id = (select auth.uid())
        and p.id = tasks.project_id
        and w.id = tasks.workspace_id
    )
  );

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.workspaces,
  public.status_templates,
  public.template_statuses,
  public.projects,
  public.task_statuses,
  public.tasks
to authenticated;
