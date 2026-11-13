import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginRedirect, refreshSession, useSession } from '../data/session'
import { weaverPost } from '../data/weaver'
import { workspacePath } from '../data/workspaces'

function NewWorkspacePage() {
  const session = useSession()
  const navigate = useNavigate()
  const signedIn = session.status === 'signed-in'
  const [siteId, setSiteId] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const site = siteId.trim().toLowerCase()
    if (!site || !name.trim()) {
      setError('A workspace needs a site id and a name.')
      return
    }
    setPending(true)
    setError('')
    try {
      const created = await weaverPost<{ key?: string; site?: string }>(
        `/v/${encodeURIComponent(site)}/$/createWorkspace.json`,
        { newName: name.trim() },
      )
      await refreshSession()
      const pageKey = created.key
      if (pageKey) {
        navigate(workspacePath(created.site || site, pageKey))
        return
      }
      navigate('/')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create the workspace.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="doc-library">
      <header className="doc-library-head">
        <h1>Create a workspace</h1>
        <p className="description">
          The workspace is created inside a site where you are an executive. Use the site id from a
          granted request on the Sites page.
        </p>
      </header>
      {signedIn ? (
        <form className="panel profile-edit" onSubmit={onSubmit}>
          <label className="discussion-field">
            <span className="field-label">Site id</span>
            <input value={siteId} onChange={(event) => setSiteId(event.target.value)} required />
          </label>
          <label className="discussion-field">
            <span className="field-label">Workspace name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          {error ? <p className="profile-empty">{error}</p> : null}
          <div className="profile-actions">
            <button className="button-light" type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create workspace'}
            </button>
            <Link className="text-link" to="/sites">
              Request a site
            </Link>
          </div>
        </form>
      ) : (
        <div className="signed-out-panel">
          <p>Log in before creating a workspace.</p>
          <button className="button-light" type="button" onClick={loginRedirect}>
            Log in
          </button>
        </div>
      )}
    </section>
  )
}

export default NewWorkspacePage
