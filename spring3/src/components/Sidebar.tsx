import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { directoryPath } from '../data/profiles'
import { documentsPath } from '../data/documents'
import { initialsFor, loginRedirect, useSession } from '../data/session'
import { switcherTree, useWorkspaces, workspaceFromLocation, type SwitcherEntry } from '../data/workspaces'
import CreateMenu from './CreateMenu'

// Props shared with the workspace layout to control
// mobile navigation and the collapsible desktop sidebar
type SidebarProps = {
  menuOpen: boolean
  collapsed: boolean
  closeMenu: () => void
  onToggleCollapsed: () => void
}

// Defines the structure of links displayed in the sidebar
type NavItem = {
  to: string
  label: string
  icon: string
  invert?: boolean
  end?: boolean
  count?: number
}

// Navigation links grouped by their purpose
// These arrays keep the sidebar content separate from its JSX
const circleLinks: NavItem[] = [
  { to: '/meetings', label: 'Meetings', icon: '/slides0.svg' },
  { to: '/tasks', label: 'To-do Tasks', icon: '/square-check0.svg' },
  { to: '/discussions', label: 'Discussions', icon: '/msg0.svg' },
]

const organizationLinks: NavItem[] = [
  { to: '/notifications', label: 'Notifications', icon: '/bell0.svg' },
  { to: directoryPath(), label: 'Profiles', icon: '/users1.svg', end: true },
  { to: '/sites', label: 'Sites', icon: '/users0.svg' },
  { to: '/emails', label: 'Emails', icon: '/mail0.svg' },
  { to: '/documents', label: 'Documents', icon: '/file0.svg' },
]

function navClassName(isActive: boolean) {
  return `nav-item${isActive ? ' current' : ''}`
}

// Main sidebar component
// Handles navigation, workspace selection, appearance settings,
// and the Create menu for desktop and mobile layouts
function Sidebar({ menuOpen, collapsed, closeMenu, onToggleCollapsed }: SidebarProps) {
  const location = useLocation()
  const session = useSession()
  useWorkspaces()
  const workspace = workspaceFromLocation(location.pathname, location.search)
  const user = session.status === 'signed-in' ? session.user : null
  const tree = switcherTree(workspace)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [askNote, setAskNote] = useState(false)


  // Expand the sidebar first when collapsed so the workspace options can be displayed
  function onSwitcherClick() {
    if (collapsed) {
      onToggleCollapsed()
      setSwitcherOpen(true)
      return
    }
    setSwitcherOpen((open) => !open)
  }

  return (
    <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>

      {/* User account information and sidebar collapse control */}
      <div className="sidebar-top">
        {user ? (
          <Link className="sidebar-user" to={`/profile/${user.key}`}>
            <strong>{user.name}</strong>
            <span>{initialsFor(user.name)}</span>
          </Link>
        ) : (
          <div className="signed-out">
            <p className="signed-out-copy">
              <strong>{session.status === 'loading' ? 'Checking session' : 'Not signed in'}</strong>
              <span>Log in to see your workspaces, meetings, and documents.</span>
            </p>
            <button className="signed-out-login" type="button" onClick={loginRedirect} disabled={session.status === 'loading'}>
              {session.status === 'loading' ? 'Checking…' : 'Log in'}
            </button>
          </div>
        )}
        <button
          className="collapse-sidebar"
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="workspace-navigation"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelIcon collapsed={collapsed} />
        </button>
      </div>
       {/* Primary navigation, Create menu, and workspace selection */}
      <div className="primary-navigation">
        <CreateMenu
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          closeMenu={closeMenu}
        />

      {/* Dashboard navigation */}
        <nav aria-label="Dashboard">
          <p className="section-label">Dashboard</p>

          <NavRow
            item={{
              to: workspace.path,
              label: 'Home',
              icon: '/house0.svg',
              end: true
            }}
            onClick={closeMenu}
          />

          {circleLinks.map((item) => (
            <NavRow
              key={item.label}
              item={item}
              onClick={closeMenu}
            />
          ))}
        </nav>

        {/* Workspace selection */}
        <section aria-label="Workspace">
          <div className="sidebar-workspace-heading">
            <p className="section-label">Workspace</p>
            <p className="workspace-description">
              Your team's shared space for meetings, tasks and documents
            </p>
          </div>

          <div className={`workspace-switcher-block${switcherOpen ? ' is-open' : ''}`}>
            <button
              className="workspace-switcher"
              type="button"
              aria-expanded={switcherOpen}
              aria-label={workspace.name}
              onClick={onSwitcherClick}
            >
              <span className="workspace-avatar" aria-hidden="true">
                {workspace.code}
              </span>

              <span className="workspace-name">
                <strong>{workspace.name}</strong>
                <span>
                  <img src="/users0.svg" alt="" width={12} height={12} />
                  {workspace.members} members
                </span>
              </span>

              <img
                className="switcher-chevron"
                src="/chevron-down0.svg"
                alt=""
                width={14}
                height={14}
              />
            </button>

            {switcherOpen && (menuOpen || !collapsed) ? (
              <div className="workspace-children">
                <SwitcherRow entry={tree.parent} onClick={closeMenu} />

                {tree.teams.map((entry) => (
                  <SwitcherRow
                    key={entry.code}
                    entry={entry}
                    onClick={closeMenu}
                  />
                ))}

                <Link
                  className="manage-workspaces"
                  to="/workspaces"
                  onClick={closeMenu}
                >
                  Manage Workspaces
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {/* Organization navigation */}
        <nav id="workspace-navigation" aria-label="Organization">
          <p className="section-label">Organization</p>

          {organizationLinks.map((item) => (
            <NavRow
              key={item.label}
              item={item.label === 'Documents'
                ? { ...item, to: documentsPath(workspace.id) }
                : item}
              onClick={closeMenu}
            />
          ))}
        </nav>
      </div>
      {/* Ask Weaver placeholder until the feature is available */}
      <button
        className={`ask-weaver${askNote ? ' is-open' : ''}`}
        type="button"
        aria-describedby="ask-weaver-note"
        onClick={() => setAskNote((open) => !open)}
      >
        <img className="ask-weaver-label" src="/ask-weaver.svg" alt="Ask Weaver" width={135} height={40} />
        <img className="ask-weaver-mark" src="/weaver-mark-scribe.svg" alt="" width={40} height={40} />
        <span className="ask-weaver-note" id="ask-weaver-note" role="status">
          Coming soon
        </span>
      </button>
    </aside>
  )
}

// Renders a workspace option in the expanded workspace switcher
function SwitcherRow({
  entry,
  onClick,
}: {
  entry: SwitcherEntry
  onClick: () => void
}) {
  return (
    <Link
      className={`workspace-child is-${entry.kind}${entry.current ? ' is-current' : ''}`}
      to={entry.path}
      aria-current={entry.current ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="workspace-avatar sm" aria-hidden="true">
        {entry.code}
      </span>
      <span className="workspace-name">
        <strong>{entry.name}</strong>
        {entry.members > 0 ? (
          <span>
            <img src="/users0.svg" alt="" width={12} height={12} />
            {entry.members} members
          </span>
        ) : null}
      </span>
    </Link>
  )
}

// Reusable navigation link with active-route styling
function NavRow({
  item,
  onClick,
}: {
  item: NavItem
  onClick: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => navClassName(isActive)}
      aria-label={item.label}
      onClick={onClick}
    >
      <img
        className={item.invert ? 'icon-on-dark' : undefined}
        src={item.icon}
        alt=""
        width={18}
        height={18}
      />
      <span>{item.label}</span>
      {item.count != null ? (
        <span className={`nav-count${item.to === '/notifications' ? ' is-notify' : ''}`}>{item.count}</span>
      ) : null}
    </NavLink>
  )
}

// Sidebar collapse icon changes direction based on its state
function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.25" y="3" width="13.5" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 3v12" stroke="currentColor" strokeWidth="1.5" />
      {collapsed ? (
        <path d="M10 7.25L12.25 9L10 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12.25 7.25L10 9L12.25 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export default Sidebar
