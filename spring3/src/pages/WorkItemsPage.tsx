import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSession } from '../data/session'
import { workspaceFromLocation } from '../data/workspaces'
import { completeGoal, createGoal, loadGoals, type GoalRow, type WorkspaceTarget } from '../data/writes'

const STATE_LABEL: Record<number, string> = {
  0: 'Error',
  1: 'Unstarted',
  2: 'Offered',
  3: 'Accepted',
  4: 'Waiting',
  5: 'Completed',
  6: 'Skipped',
  8: 'Frozen',
}

function dateLabel(ms: number) {
  if (!ms) {
    return 'No due date'
  }
  return new Date(ms).toLocaleDateString()
}

function WorkItemsPage({ scope }: { scope: 'workspace' | 'all' }) {
  const [params] = useSearchParams()
  const session = useSession()
  const workspace = workspaceFromLocation(
    scope === 'all' ? '/tasks' : '/action-items',
    params.toString() ? `?${params.toString()}` : '',
  )
  const signedIn = session.status === 'signed-in' ? session.user : null
  const spaces: WorkspaceTarget[] =
    scope === 'all'
      ? session.status === 'signed-in'
        ? session.workspaces.map((row) => ({
            siteKey: row.siteKey,
            pageKey: row.pageKey,
            name: row.name,
          }))
        : []
      : workspace.siteKey
        ? [{ siteKey: workspace.siteKey, pageKey: workspace.pageKey, name: workspace.name }]
        : []
  const [rows, setRows] = useState<GoalRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [synopsis, setSynopsis] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState('')
  const [target, setTarget] = useState('')
  const [pending, setPending] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const refresh = useCallback(async () => {
    if (!signedIn || spaces.length === 0) {
      setRows([])
      return
    }
    setLoading(true)
    setError('')
    try {
      setRows(await loadGoals(spaces))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load action items.')
    } finally {
      setLoading(false)
    }
  }, [signedIn, spaces.map((space) => `${space.siteKey}/${space.pageKey}`).join('|')])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const chosen = spaces.find((space) => `${space.siteKey}/${space.pageKey}` === target) ?? spaces[0]
  const visible = rows.filter((row) => showDone || (row.state !== 5 && row.state !== 6))

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chosen) {
      setError('Open a workspace before adding an action item.')
      return
    }
    if (!synopsis.trim()) {
      setError('An action item needs a name.')
      return
    }
    setPending(true)
    setError('')
    try {
      const dueMs = due ? new Date(`${due}T12:00:00`).getTime() : 0
      await createGoal(chosen, {
        synopsis: synopsis.trim(),
        description: description.trim(),
        duedate: Number.isNaN(dueMs) ? 0 : dueMs,
      })
      setSynopsis('')
      setDescription('')
      setDue('')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the action item.')
    } finally {
      setPending(false)
    }
  }

  async function markDone(row: GoalRow) {
    setError('')
    try {
      await completeGoal(row)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the action item.')
    }
  }

  const title = scope === 'all' ? 'Tasks' : 'Action items'

  return (
    <section className="profile-screen">
      <header className="doc-library-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-item">
            <img src="/house0.svg" alt="" width={12} height={12} />
            <Link to="/">Home</Link>
          </span>
          <span className="breadcrumb-item">
            <img src="/chevron-right0.svg" alt="" width={12} height={12} />
            <span aria-current="page">{title}</span>
          </span>
        </nav>
        <div className="title-row">
          <h1>{title}</h1>
          <span className="count-pill">{visible.length}</span>
        </div>
        <p className="description">
          {scope === 'all'
            ? 'Action items from every workspace on your account.'
            : `Action items in ${workspace.name}.`}
        </p>
      </header>

      {!signedIn ? <p className="profile-empty">Sign in to see and add action items.</p> : null}
      {signedIn && spaces.length === 0 ? (
        <p className="profile-empty">Open a workspace before adding action items.</p>
      ) : null}

      {signedIn && chosen ? (
        <form className="panel profile-section" onSubmit={onCreate}>
          <h2>Add an action item</h2>
          {spaces.length > 1 ? (
            <label className="field">
              Workspace
              <select value={target || `${chosen.siteKey}/${chosen.pageKey}`} onChange={(event) => setTarget(event.target.value)}>
                {spaces.map((space) => (
                  <option key={`${space.siteKey}/${space.pageKey}`} value={`${space.siteKey}/${space.pageKey}`}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            Name
            <input value={synopsis} onChange={(event) => setSynopsis(event.target.value)} required />
          </label>
          <label className="field">
            Description
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="field">
            Due date
            <input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </label>
          <button className="button-solid" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save action item'}
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="profile-empty">Loading action items…</p> : null}

      <section className="panel profile-section">
        <div className="title-row">
          <h2>Open items</h2>
          <label className="discussion-notify">
            <input type="checkbox" checked={showDone} onChange={(event) => setShowDone(event.target.checked)} />
            Show completed
          </label>
        </div>
        {visible.length === 0 && !loading ? <p className="profile-empty">No action items yet.</p> : null}
        <ul className="notice-list">
          {visible.map((row) => (
            <li key={`${row.siteKey}/${row.pageKey}/${row.id}`}>
              <div className="notice-row">
                <span className="tag">{STATE_LABEL[row.state] ?? 'Open'}</span>
                <span>
                  <strong>{row.synopsis}</strong>
                  <span>
                    {row.workspaceName}
                    {row.description ? ` · ${row.description}` : ''}
                    {` · ${dateLabel(row.duedate)}`}
                  </span>
                </span>
                {row.state !== 5 && row.state !== 6 ? (
                  <button className="button-light" type="button" onClick={() => void markDone(row)}>
                    Mark done
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export function ActionItemsPage() {
  return <WorkItemsPage scope="workspace" />
}

export function TasksPage() {
  return <WorkItemsPage scope="all" />
}
