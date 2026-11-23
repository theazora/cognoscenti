import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PROFILE_TIMEZONES } from '../data/profiles'
import { refreshSession, useSession } from '../data/session'
import { weaverFetch, weaverPost } from '../data/weaver'

const PERIODS = [
  { id: '1', label: 'Daily' },
  { id: '7', label: 'Weekly' },
  { id: '30', label: 'Monthly' },
]

function SettingsPage() {
  const session = useSession()
  const user = session.status === 'signed-in' ? session.user : null
  const [timeZone, setTimeZone] = useState(user?.timeZone || PROFILE_TIMEZONES[0])
  const [period, setPeriod] = useState('1')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (user?.timeZone) {
      setTimeZone(user.timeZone)
    }
  }, [user?.timeZone])

  useEffect(() => {
    if (!user) {
      return
    }
    let cancel = false
    weaverFetch<{ user?: { notifyPeriod?: number } }>('/v/session.json')
      .then((data) => {
        if (!cancel && data.user?.notifyPeriod) {
          setPeriod(String(data.user.notifyPeriod))
        }
      })
      .catch(() => {
        // The form still saves a period if the current value cannot be read.
      })
    return () => {
      cancel = true
    }
  }, [user?.key])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      setError('Sign in to change settings.')
      return
    }
    setPending(true)
    setError('')
    setMessage('')
    try {
      await weaverPost(`/v/${encodeURIComponent(user.key)}/updateProfile.json`, {
        timeZone,
        notifyPeriod: Number(period),
      })
      await refreshSession()
      setMessage('Settings saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save settings.')
    } finally {
      setPending(false)
    }
  }

  const zones = timeZone && !PROFILE_TIMEZONES.includes(timeZone) ? [timeZone, ...PROFILE_TIMEZONES] : PROFILE_TIMEZONES

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
            <span aria-current="page">Settings</span>
          </span>
        </nav>
        <h1>Settings</h1>
        <p className="description">Time zone is used in email. Notify period is how often Weaver sends your digest.</p>
      </header>

      {!user ? <p className="profile-empty">Sign in to change settings.</p> : null}

      {user ? (
        <form className="panel profile-section" onSubmit={onSubmit}>
          <label className="field">
            Time zone
            <select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Email digest
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIODS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button-solid" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save settings'}
          </button>
          {message ? <p>{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <p>
            Name, email, and description are saved on your <Link to={`/profile/${user.key}`}>profile</Link>. The privacy
            notice is on the <Link to="/privacy">privacy page</Link>.
          </p>
        </form>
      ) : null}
    </section>
  )
}

export default SettingsPage
