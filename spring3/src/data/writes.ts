import { openWorkspace } from './live'
import type { SessionUser } from './session'
import { weaverFetch, weaverPost } from './weaver'

export type WorkspaceTarget = {
  siteKey: string
  pageKey: string
  name?: string
}

export type GoalRow = {
  id: string
  universalid: string
  synopsis: string
  description: string
  duedate: number
  state: number
  siteKey: string
  pageKey: string
  workspaceName: string
}

export type MailRow = {
  id: string
  subject: string
  addressee: string
  created: number
}

type ServerGoal = {
  id?: string
  universalid?: string
  synopsis?: string
  description?: string
  duedate?: number
  state?: number
}

type ServerMail = {
  Subject?: string
  Addressee?: string
  CreateDate?: number
}

function workspacePath(siteKey: string, pageKey: string, name: string) {
  return `/v/${encodeURIComponent(siteKey)}/${encodeURIComponent(pageKey)}/${name}`
}

function requireWorkspace(workspace: WorkspaceTarget) {
  if (!workspace.siteKey || !workspace.pageKey) {
    throw new Error('Open a workspace before saving.')
  }
}

export async function saveLinkedDocument(
  workspace: WorkspaceTarget,
  input: { name: string; description: string; url: string },
  you: SessionUser | null,
) {
  requireWorkspace(workspace)
  const saved = await weaverPost<{ id?: string; name?: string; url?: string }>(
    `${workspacePath(workspace.siteKey, workspace.pageKey, 'docsUpdate.json')}?did=~new~`,
    {
      attType: 'URL',
      name: input.name,
      description: input.description,
      url: input.url,
    },
  )
  await openWorkspace(workspace.siteKey, workspace.pageKey, you)
  return saved
}

export async function saveUploadedDocument(
  workspace: WorkspaceTarget,
  file: File,
  input: { name: string; description: string },
  you: SessionUser | null,
) {
  requireWorkspace(workspace)
  const named = await weaverFetch<{ tempFileName?: string }>(
    workspacePath(workspace.siteKey, workspace.pageKey, 'GetTempName.json'),
  )
  const tempName = named.tempFileName
  if (!tempName) {
    throw new Error('Weaver did not reserve a file name.')
  }
  const query = `tempName=${encodeURIComponent(tempName)}`
  await weaverFetch(workspacePath(workspace.siteKey, workspace.pageKey, `UploadTempFile.json?${query}`), {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  const saved = await weaverPost<{ id?: string; name?: string; url?: string }>(
    workspacePath(workspace.siteKey, workspace.pageKey, `AttachTempFile.json?${query}`),
    {
      doc: {
        name: input.name,
        description: input.description,
        size: file.size,
        attType: 'FILE',
      },
    },
  )
  await openWorkspace(workspace.siteKey, workspace.pageKey, you)
  return saved
}

export async function postDiscussion(
  workspace: WorkspaceTarget,
  input: { subject: string; body: string; draft: boolean; notify: boolean },
  you: SessionUser | null,
) {
  requireWorkspace(workspace)
  const saved = await weaverPost<{ id?: string }>(
    `${workspacePath(workspace.siteKey, workspace.pageKey, 'noteHtmlUpdate.json')}?nid=~new~`,
    {
      subject: input.subject,
      wiki: input.body,
      discussionPhase: input.draft ? 'Draft' : 'Freeform',
      sendEmailNow: !input.draft && input.notify,
    },
  )
  await openWorkspace(workspace.siteKey, workspace.pageKey, you)
  return saved
}

export async function loadGoals(workspaces: WorkspaceTarget[]): Promise<GoalRow[]> {
  const settled = await Promise.allSettled(
    workspaces
      .filter((workspace) => workspace.siteKey && workspace.pageKey)
      .map(async (workspace) => {
        const data = await weaverFetch<{ list?: ServerGoal[] }>(
          workspacePath(workspace.siteKey, workspace.pageKey, 'allActionsList.json'),
        )
        return (data.list ?? [])
          .filter((row) => row.id && row.state !== 9)
          .map((row) => ({
            id: row.id ?? '',
            universalid: row.universalid ?? '',
            synopsis: row.synopsis || 'Untitled action item',
            description: row.description ?? '',
            duedate: row.duedate ?? 0,
            state: row.state ?? 0,
            siteKey: workspace.siteKey,
            pageKey: workspace.pageKey,
            workspaceName: workspace.name || workspace.pageKey,
          }))
      }),
  )
  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}

export async function createGoal(
  workspace: WorkspaceTarget,
  input: { synopsis: string; description: string; duedate: number },
) {
  requireWorkspace(workspace)
  return weaverPost(
    `${workspacePath(workspace.siteKey, workspace.pageKey, 'updateGoal.json')}?gid=~new~`,
    {
      synopsis: input.synopsis,
      description: input.description,
      state: 2,
      ...(input.duedate > 0 ? { duedate: input.duedate } : {}),
    },
  )
}

export async function completeGoal(goal: GoalRow) {
  return weaverPost(
    `${workspacePath(goal.siteKey, goal.pageKey, 'updateGoal.json')}?gid=${encodeURIComponent(goal.id)}`,
    {
      universalid: goal.universalid,
      state: 5,
    },
  )
}

export async function loadScratchpad(workspace: WorkspaceTarget) {
  requireWorkspace(workspace)
  const data = await weaverFetch<{ scratchpad?: string }>(
    workspacePath(workspace.siteKey, workspace.pageKey, 'GetScratchpad.json'),
  )
  return data.scratchpad ?? ''
}

export async function saveScratchpad(workspace: WorkspaceTarget, scratchpad: string) {
  requireWorkspace(workspace)
  const data = await weaverPost<{ scratchpad?: string }>(
    workspacePath(workspace.siteKey, workspace.pageKey, 'UpdateScratchpad.json'),
    { scratchpad },
  )
  return data.scratchpad ?? scratchpad
}

export async function loadEmails(workspace: WorkspaceTarget, searchValue: string): Promise<MailRow[]> {
  requireWorkspace(workspace)
  const data = await weaverPost<{ list?: ServerMail[] }>(
    workspacePath(workspace.siteKey, workspace.pageKey, 'QueryEmail.json'),
    { offset: 0, batch: 50, searchValue },
  )
  return (data.list ?? []).map((row, index) => ({
    id: `${row.CreateDate ?? index}-${index}`,
    subject: row.Subject || 'No subject',
    addressee: row.Addressee || '',
    created: row.CreateDate ?? 0,
  }))
}
