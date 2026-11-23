import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSession } from '../data/session'
import { workspaceFromLocation } from '../data/workspaces'
import { loadEmails, type MailRow } from '../data/writes'

function whenLabel(ms: number) {
  if (!ms) {
    return ''
  }
  return new Date(ms).toLocaleString()
}

function EmailsPage() {
  const [params] = useSearchParams()
  const session = useSession()
  const workspace = workspaceFromLocation('/emails', params.toString() ? `?${params.toString()}` : '')
  const signedIn = session.status === 'signed-in'
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<MailRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(
    async (searchValue: string) => {
      if (!signedIn || !workspace.siteKey || !workspace.pageKey) {
        setRows([])
        return
      }
      setLoading(true)
      setError('')
      try {
        setRows(await loadEmails(workspace, searchValue))
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not load email.')
      } finally {
        setLoading(false)
      }
    },
    [signedIn, workspace.siteKey, workspace.pageKey],
  )

  useEffect(() => {
    void refresh('')
  }, [refresh])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void refresh(query.trim())
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
            <span aria-current="page">Emails</span>
          </span>
        </nav>
        <div className="title-row">
          <h1>Emails</h1>
          <span className="count-pill">{rows.length}</span>
        </div>
        <p className="description">Mail Weaver has recorded for {workspace.name}.</p>
      </header>

      {!signedIn ? <p className="profile-empty">Sign in to read workspace email.</p> : null}
      {signedIn && !workspace.siteKey ? (
        <p className="profile-empty">Open a workspace to see its email.</p>
      ) : null}

      {signedIn && workspace.siteKey ? (
        <form className="profile-search profile-search-wide" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="email-search">
            Search email
          </label>
          <input
            id="email-search"
            type="search"
            value={query}
            placeholder="Subject or address"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="button-solid" type="submit">
            Search
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="profile-empty">Loading email…</p> : null}

      <section className="panel profile-section">
        {rows.length === 0 && !loading ? <p className="profile-empty">No email recorded for this workspace.</p> : null}
        <ul className="notice-list">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="notice-row">
                <span className="tag">Email</span>
                <span>
                  <strong>{row.subject}</strong>
                  <span>
                    {row.addressee}
                    {row.created ? ` · ${whenLabel(row.created)}` : ''}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default EmailsPage
