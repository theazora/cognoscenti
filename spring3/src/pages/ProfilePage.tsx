import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ProfileEdit from '../components/profile/ProfileEdit'
import ProfileView from '../components/profile/ProfileView'
import { directoryPath, profileSlug, useProfile, type Profile } from '../data/profiles'
import { initialsFor, useSession, type SessionSnapshot } from '../data/session'
import { workspaceFromLocation, workspaceIdFor, workspacePath } from '../data/workspaces'

function signedInProfile(slug: string | undefined, session: SessionSnapshot): Profile | undefined {
  const user = session.status === 'signed-in' ? session.user : null
  if (!slug || !user) {
    return undefined
  }
  if (slug !== user.key && slug !== profileSlug(user.name)) {
    return undefined
  }
  const email = user.preferred || (user.uid.includes('@') ? user.uid : '')
  return {
    slug: user.key,
    initials: initialsFor(user.name),
    name: user.name,
    you: true,
    email,
    timeZone: user.timeZone,
    description: user.description,
    key: user.key,
    lastLogin: user.lastLogin,
    theme: 'default',
    memberships: session.workspaces.map((row) => ({
      workspaceId: workspaceIdFor(row.siteKey, row.pageKey),
      workspaceKey: row.pageKey,
      workspaceName: row.name,
      path: workspacePath(row.siteKey, row.pageKey),
      role: 'member',
    })),
  }
}

function ProfilePage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const workspaceId = params.get('workspace')
  const workspace = workspaceFromLocation('/profile', workspaceId ? `?workspace=${workspaceId}` : '')
  const session = useSession()
  const profile = useProfile(slug) ?? signedInProfile(slug, session)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setEditing(false)
  }, [slug])

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
            <Link to={directoryPath(workspaceId)}>Profiles</Link>
          </span>
          <span className="breadcrumb-item">
            <img src="/chevron-right0.svg" alt="" width={12} height={12} />
            <span aria-current="page">{profile?.name ?? 'Profile'}</span>
          </span>
        </nav>
      </header>

      {profile ? (
        editing && profile.you ? (
          <ProfileEdit profile={profile} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        ) : (
          <ProfileView profile={profile} onEdit={profile.you ? () => setEditing(true) : undefined} />
        )
      ) : (
        <section className="panel profile-section">
          <h2>Profile not found</h2>
          <p>Weaver has no profile loaded for that address.</p>
          <Link className="text-link" to={directoryPath(workspaceId)}>
            Back to profiles
          </Link>
        </section>
      )}
    </section>
  )
}

export default ProfilePage
