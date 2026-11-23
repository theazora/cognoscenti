import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDiscussions } from '../data/discussions'
import { openWorkspace } from '../data/live'
import { useSession } from '../data/session'
import { workspaceFromLocation, type WorkspaceDemo } from '../data/workspaces'
import { loadScratchpad, saveScratchpad, type WorkspaceTarget } from '../data/writes'

function targetFor(workspace: WorkspaceDemo, spaces: WorkspaceTarget[]): WorkspaceTarget | null {
  if (workspace.siteKey && workspace.pageKey) {
    return { siteKey: workspace.siteKey, pageKey: workspace.pageKey, name: workspace.name }
  }
  return spaces[0] ?? null
}

function NotesPage() {
  const [params] = useSearchParams()
  const session = useSession()
  const workspace = workspaceFromLocation('/notes', params.toString() ? `?${params.toString()}` : '')
  const discussions = useDiscussions().filter((row) => !workspace.id || row.workspaceId === workspace.id)
  const spaces: WorkspaceTarget[] =
    session.status === 'signed-in'
      ? session.workspaces.map((row) => ({ siteKey: row.siteKey, pageKey: row.pageKey, name: row.name }))
      : []
  const target = targetFor(workspace, spaces)
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!target) {
      return
    }
    let cancel = false
    setLoaded(false)
    loadScratchpad(target)
      .then((value) => {
        if (!cancel) {
          setText(value)
          setLoaded(true)
        }
      })
      .catch((caught: unknown) => {
        if (!cancel) {
          setError(caught instanceof Error ? caught.message : 'Could not load notes.')
        }
      })
    if (session.status === 'signed-in') {
      void openWorkspace(target.siteKey, target.pageKey, session.user).catch(() => {
        // Workspace notes stay empty until a workspace can be loaded.
      })
    }
    return () => {
      cancel = true
    }
  }, [target?.siteKey, target?.pageKey, session.status])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!target) {
      setError('Open a workspace before saving notes.')
      return
    }
    setPending(true)
    setError('')
    setMessage('')
    try {
      setText(await saveScratchpad(target, text))
      setMessage('Notes saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save notes.')
    } finally {
      setPending(false)
    }
  }

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
            <span aria-current="page">Notes</span>
          </span>
        </nav>
        <div className="title-row">
          <h1>Notes</h1>
        </div>
        <p className="description">Your scratchpad is private. Workspace notes are the discussions in this workspace.</p>
      </header>

      {!target ? <p className="profile-empty">Open a workspace before using notes.</p> : null}

      {target ? (
        <form className="panel profile-section" onSubmit={onSubmit}>
          <h2>Scratchpad</h2>
          <label className="field">
            Notes
            <textarea rows={10} value={text} disabled={!loaded && !error} onChange={(event) => setText(event.target.value)} />
          </label>
          <button className="button-solid" type="submit" disabled={pending || !loaded}>
            {pending ? 'Saving…' : 'Save notes'}
          </button>
          {message ? <p>{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}

      <section className="panel profile-section">
        <h2>Workspace notes</h2>
        {discussions.length === 0 ? (
          <p className="profile-empty">No discussions in this workspace yet.</p>
        ) : (
          <ul className="notice-list">
            {discussions.map((row) => (
              <li key={row.id}>
                <Link className="notice-row" to={`/discussions?workspace=${encodeURIComponent(row.workspaceId)}`}>
                  <span className="tag">{row.status === 'draft' ? 'Draft' : 'Open'}</span>
                  <span>
                    <strong>{row.title}</strong>
                    <span>{row.authorName}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default NotesPage
