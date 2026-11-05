import { TEST_USERS, WORKSPACE_MEMBERS, type CircleId } from './testdata'
import { workspaces } from './workspaces'

export type ProfileCircle = {
  id: CircleId
  name: string
  path: string
}

export type Profile = {
  slug: string
  initials: string
  name: string
  role: 'steward' | 'member'
  you?: boolean
  email: string
  timezone: string
  about: string
  circles: ProfileCircle[]
}

const CIRCLE_ORDER: CircleId[] = ['organization', 'ux', 'dev', 'branding', 'marketing', 'logistics']

const TIMEZONES = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York']
const PLACEHOLDER_BIO = 'This is where a user can type their bio'

export function profileSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function profilePath(name: string, workspaceId?: string) {
  const path = `/profile/${profileSlug(name)}`
  return workspaceId ? `${path}?workspace=${encodeURIComponent(workspaceId)}` : path
}

function circlesFor(name: string): ProfileCircle[] {
  return CIRCLE_ORDER.filter((id) => WORKSPACE_MEMBERS[id].includes(name)).map((id) => ({
    id,
    name: workspaces[id].name,
    path: workspaces[id].path,
  }))
}

export const PROFILES: Profile[] = TEST_USERS.map((user, index) => ({
  slug: profileSlug(user.name),
  initials: user.initials,
  name: user.name,
  role: user.role,
  you: user.you,
  email: `${profileSlug(user.name).replace(/-/g, '.')}@class.example`,
  timezone: user.you ? 'America/Los_Angeles' : TIMEZONES[index % TIMEZONES.length],
  about: user.you ? '(Add Bio)' : PLACEHOLDER_BIO,
  circles: circlesFor(user.name),
}))

export function profileBySlug(slug: string | undefined) {
  if (!slug) {
    return PROFILES.find((profile) => profile.you) ?? PROFILES[0]
  }
  return PROFILES.find((profile) => profile.slug === slug)
}

export const PROFILE_TIMEZONES = TIMEZONES
