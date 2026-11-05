import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  PROFILE_TIMEZONES,
  PROFILES,
  profileBySlug,
  profilePath,
  type Profile,
} from '../data/profiles'
import { workspaceFromLocation } from '../data/workspaces'

type RoleFilter = 'all' | Profile['role']

type ProfileEdits = {
  name: string
  email: string
  timezone: string
  about: string
}

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'steward', label: 'Stewards' },
  { id: 'member', label: 'Members' },
]

function ProfilePage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const workspaceId = params.get('workspace')
  const workspace = workspaceFromLocation('/profile', workspaceId ? `?workspace=${workspaceId}` : '')
  const selected = profileBySlug(slug)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [edits, setEdits] = useState<ProfileEdits | null>(null)
  const [savedNote, setSavedNote] = useState('')

  const base = selected ?? PROFILES.find((profile) => profile.you) ?? PROFILES[0]
  const shown = applyEdits(base, edits)

  useEffect(() => {
    setSavedNote('')
  }, [slug])

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase()
    return PROFILES.filter((profile) => {
      const row = applyEdits(profile, edits)
      if (workspaceId && !row.circles.some((circle) => circle.id === workspace.id)) {
        return false
      }
      if (role !== 'all' && row.role !== role) {
        return false
      }
      if (!search) {
        return true
      }
      return `${row.name} ${row.email} ${row.about}`.toLowerCase().includes(search)
    })
  }, [edits, query, role, workspace.id, workspaceId])

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setEdits({
      name: String(data.get('name') ?? '').trim() || shown.name,
      email: String(data.get('email') ?? '').trim() || shown.email,
      timezone: String(data.get('timezone') ?? shown.timezone),
      about: String(data.get('about') ?? '').trim(),
    })
    setSavedNote('Saved on this screen. This mid-fi pass does not send the profile anywhere.')
  }

  return (
    <section className="profile-screen">
      <header className="doc-library-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-item">
            <img src="/house0.svg" alt="" width={12} height={12} />
            <Link to={workspace.path}>Home</Link>
          </span>
          <span className="breadcrumb-item">
            <img src="/chevron-right0.svg" alt="" width={12} height={12} />
            <span aria-current="page">Profiles</span>
          </span>
        </nav>
        <div className="title-row">
          <h1>Profiles</h1>
          <span className="count-pill">{visible.length}</span>
        </div>
        <p className="description">
          {workspaceId
            ? `People in ${workspace.name}. Open a profile to see how they show up in the class.`
            : 'Your profile and the other people in the class workspace.'}
        </p>
      </header>

      <div className="profile-layout">
        <section className="panel profile-list" aria-label="Profile list">
          <form
            className="profile-search"
            onSubmit={(event) => event.preventDefault()}
          >
            <img src="/search1.png" alt="" width={14} height={14} />
            <label className="visually-hidden" htmlFor="profile-search">
              Find a profile
            </label>
            <input
              id="profile-search"
              type="search"
              value={query}
              placeholder="Find a profile..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>

          <div className="doc-filters" role="group" aria-label="Filter profiles">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={role === filter.id ? 'is-selected' : undefined}
                aria-pressed={role === filter.id}
                onClick={() => setRole(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="profile-empty">No profiles match that search.</p>
          ) : (
            <ul className="profile-rows">
              {visible.map((profile) => {
                const row = applyEdits(profile, edits)
                const current = row.slug === shown.slug && Boolean(selected || !slug)
                return (
                  <li key={row.slug}>
                    <Link
                      className={`profile-row${current ? ' is-current' : ''}`}
                      to={profilePath(profile.name, workspaceId ?? undefined)}
                      aria-current={current ? 'page' : undefined}
                    >
                      <span className="person-avatar" aria-hidden="true">
                        {row.initials}
                      </span>
                      <span>
                        <strong>
                          {row.name}
                          {row.you ? <span className="profile-you">You</span> : null}
                        </strong>
                        <span>{row.role === 'steward' ? 'Steward' : 'Member'}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {selected || !slug ? (
          <ProfileDetail
            profile={shown}
            savedNote={savedNote}
            onSave={onSave}
            onReset={() => {
              setEdits(null)
              setSavedNote('')
            }}
          />
        ) : (
          <section className="panel profile-detail">
            <h2>Profile not in this prototype</h2>
            <p>Pick someone from the list. These records are demo people only.</p>
          </section>
        )}
      </div>
    </section>
  )
}

function ProfileDetail({
  profile,
  savedNote,
  onSave,
  onReset,
}: {
  profile: Profile
  savedNote: string
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onReset: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [timezone, setTimezone] = useState(profile.timezone)
  const [about, setAbout] = useState(profile.about)

  useEffect(() => {
    setName(profile.name)
    setEmail(profile.email)
    setTimezone(profile.timezone)
    setAbout(profile.about)
  }, [profile.name, profile.email, profile.timezone, profile.about])

  return (
    <article className="panel profile-detail" aria-labelledby="profile-name">
      <div className="profile-identity">
        <span className="person-avatar profile-avatar" aria-hidden="true">
          {profile.initials}
        </span>
        <div>
          <h2 id="profile-name">{profile.name}</h2>
          <p>
            {profile.role === 'steward' ? 'Steward' : 'Member'}
            {profile.you ? ' · This is your profile' : ' · View only'}
          </p>
        </div>
      </div>

      {profile.you ? (
        <form className="profile-form" onSubmit={onSave}>
          <label className="discussion-field">
            <span>Display name</span>
            <input name="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="discussion-field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="discussion-field">
            <span>Time zone</span>
            <select name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {PROFILE_TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="discussion-field">
            <span>About</span>
            <textarea name="about" rows={4} value={about} onChange={(event) => setAbout(event.target.value)} />
          </label>
          <div className="profile-actions">
            <button className="button-light" type="button" onClick={onReset}>
              Reset
            </button>
            <button className="button-solid" type="submit">
              Save profile
            </button>
          </div>
          {savedNote ? <p className="profile-saved">{savedNote}</p> : null}
        </form>
      ) : (
        <dl className="profile-facts">
          <div>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Time zone</dt>
            <dd>{profile.timezone}</dd>
          </div>
          <div>
            <dt>About</dt>
            <dd>{profile.about}</dd>
          </div>
        </dl>
      )}

      <div className="profile-circles">
        <h3>Workspaces</h3>
        <ul>
          {profile.circles.map((circle) => (
            <li key={circle.id}>
              <Link className="chip" to={circle.path}>
                {circle.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function applyEdits(profile: Profile, edits: ProfileEdits | null): Profile {
  if (!profile.you || !edits) {
    return profile
  }
  return { ...profile, ...edits }
}

export default ProfilePage
