import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loginRedirect, useSession } from '../data/session'
import { weaverFetch, weaverPost } from '../data/weaver'

type SiteRequestRow = {
  requestId?: string
  siteId?: string
  siteName?: string
  purpose?: string
  requester?: string
  status?: string
}

function siteIdFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
}

function SitesPage() {
  const session = useSession()
  const user = session.status === 'signed-in' ? session.user : null
  const [siteName, setSiteName] = useState('')
  const [siteId, setSiteId] = useState('')
  const [purpose, setPurpose] = useState('')
  const [idTouched, setIdTouched] = useState(false)
  const [requests, setRequests] = useState<SiteRequestRow[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const loadRequests = useCallback(async () => {
    if (!user) {
      return
    }
    try {
      const data = await weaverFetch<{ requests?: SiteRequestRow[] }>('/v/su/siteRequests.json')
      setRequests(data.requests ?? [])
      setReviewNote('')
    } catch (caught) {
      setReviewNote(caught instanceof Error ? caught.message : 'Unable to list site requests.')
    }
  }, [user])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  function onName(value: string) {
    setSiteName(value)
    if (!idTouched) {
      setSiteId(siteIdFromName(value))
    }
  }

  async function onRequest(event: FormEvent) {
    event.preventDefault()
    if (!user) {
      return
    }
    const id = siteIdFromName(siteId)
    if (siteName.trim().length < 4) {
      setError('Site name needs at least 4 letters.')
      return
    }
    if (id.length < 4) {
      setError('Site id needs 4 to 12 letters or numbers.')
      return
    }
    if (!purpose.trim()) {
      setError('Add a short purpose so the request is complete.')
      return
    }
    setPending(true)
    setError('')
    setMessage('')
    try {
      const created = await weaverPost<SiteRequestRow>(`/v/${encodeURIComponent(user.key)}/siteRequest.json`, {
        siteName: siteName.trim(),
        siteId: id,
        purpose: purpose.trim(),
        requester: user.preferred || user.uid,
        preapprove: '',
      })
      setMessage(
        created.status
          ? `Request ${created.requestId ?? ''} is ${created.status}.`
          : 'Site request was sent.',
      )
      setSiteName('')
      setSiteId('')
      setPurpose('')
      setIdTouched(false)
      await loadRequests()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to request a site.')
    } finally {
      setPending(false)
    }
  }

  async function decide(row: SiteRequestRow, newStatus: 'Granted' | 'Denied') {
    if (!row.requestId) {
      return
    }
    setPending(true)
    setError('')
    setMessage('')
    try {
      const updated = await weaverPost<SiteRequestRow>('/v/su/acceptOrDenySite.json', {
        requestId: row.requestId,
        siteId: row.siteId ?? '',
        newStatus,
      })
      setMessage(
        newStatus === 'Granted'
          ? `Site ${updated.siteId ?? row.siteId} was created. You are an executive of it.`
          : `Request ${row.requestId} was denied.`,
      )
      await loadRequests()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update that request.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="doc-library">
      <header className="doc-library-head">
        <h1>Sites</h1>
        <p className="description">
          A site is the folder a workspace lives in. Request one, then grant it. Granting creates the
          site and makes the requester an executive.
        </p>
      </header>

      {session.status !== 'signed-in' ? (
        <div className="signed-out-panel">
          <p>Log in before requesting a site.</p>
          <button className="button-light" type="button" onClick={loginRedirect}>
            Log in
          </button>
        </div>
      ) : (
        <form className="panel profile-edit" onSubmit={onRequest}>
          <h2>Request a site</h2>
          <label className="discussion-field">
            <span className="field-label">Site name</span>
            <input value={siteName} onChange={(event) => onName(event.target.value)} required />
          </label>
          <label className="discussion-field">
            <span className="field-label">Site id</span>
            <input
              value={siteId}
              onChange={(event) => {
                setIdTouched(true)
                setSiteId(siteIdFromName(event.target.value))
              }}
              minLength={4}
              maxLength={12}
              required
            />
          </label>
          <label className="discussion-field">
            <span className="field-label">Purpose</span>
            <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} required />
          </label>
          <div className="profile-actions">
            <button className="button-light" type="submit" disabled={pending}>
              {pending ? 'Sending…' : 'Request site'}
            </button>
            <Link className="text-link" to="/workspaces">
              Create a workspace
            </Link>
          </div>
        </form>
      )}

      {message ? <p className="profile-empty">{message}</p> : null}
      {error ? <p className="profile-empty">{error}</p> : null}

      <section className="panel profile-section">
        <h2>Site requests</h2>
        {reviewNote ? <p className="profile-empty">{reviewNote}</p> : null}
        {requests.length === 0 && !reviewNote ? <p className="profile-empty">No site requests yet.</p> : null}
        <ul className="profile-rows">
          {requests.map((row) => (
            <li key={row.requestId || `${row.siteId}-${row.status}`}>
              <div className="profile-row">
                <span>
                  <strong>{row.siteName || 'Untitled site'}</strong>
                  <span>
                    {row.siteId} · {row.status} · {row.requester}
                  </span>
                </span>
                {row.status === 'requested' ? (
                  <span className="profile-actions">
                    <button className="button-light" type="button" disabled={pending} onClick={() => decide(row, 'Granted')}>
                      Grant
                    </button>
                    <button className="button-light" type="button" disabled={pending} onClick={() => decide(row, 'Denied')}>
                      Deny
                    </button>
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default SitesPage
