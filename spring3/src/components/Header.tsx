// React hooks and TypeScript types
import { useEffect, useRef, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'

// Routing and application data
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useNotices } from '../data/notices'
import { profileHref } from '../data/profiles'
import { initialsFor, loginRedirect, useSession } from '../data/session'
import { workspaceFromLocation } from '../data/workspaces'

// Theme utilities and shared components
import { applyTheme, brandMark, readTheme, themes, type ThemeId } from '../theme'
import Menu from './Menu'
import CreateMenu from './CreateMenu'

// Navigation state is managed by the parent layout
type HeaderProps = {
  menuOpen: boolean
  setMenuOpen: Dispatch<SetStateAction<boolean>>
}

function Header({ menuOpen, setMenuOpen }: HeaderProps) {
  // Current session and notification information
  const navigate = useNavigate()

  // Identify the active workspace for workspace-specific Create actions
  const location = useLocation()
  const workspace = workspaceFromLocation(location.pathname, location.search)

  const session = useSession()
  const user = session.status === 'signed-in' ? session.user : null
  const notices = useNotices()
  const noticeCount = notices.fromPeople.length + notices.workspace.length

  // Account display information
  const accountName = user ? user.name : session.status === 'loading' ? 'Checking…' : 'Not signed in'
  const accountInitials = user ? initialsFor(user.name) : ''

  // Search input reference and current theme
  const inputRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<ThemeId>(() => readTheme())

  // Apply the selected theme and update the header's theme state
  function chooseTheme(next: ThemeId) {
    applyTheme(next)
    setTheme(next)
  }

  // Support Cmd+K (Mac) and Ctrl+K (Windows) to focus search
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Navigate to search results using the submitted query
  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = inputRef.current?.value.trim() ?? ''
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <header className="site-header">
      <button
        className="menu-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="workspace-navigation"
      >
        {menuOpen ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        ) : (
          <span aria-hidden="true">☰</span>
        )}
      </button>

      <Link className="brand" to="/">
        <span className="brand-logo" aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet="/weaver-mark.svg" />
            <img src={brandMark(theme)} alt="" width={48} height={48} />
          </picture>
        </span>
        <span className="brand-name">Circle Weaver</span>
      </Link>

      {/* Desktop search form */}
      <form className="header-search" onSubmit={onSearch}>
        <img src="/search1.png" alt="" width={14} height={14} />
        <label className="visually-hidden" htmlFor="site-search">
          Search workspaces, documents, people
        </label>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          name="q"
          placeholder="Search workspaces, documents, people..."
        />
      </form>

      {/* Desktop utilities and account menu */}
      <div className="header-tools">
        <Link className="icon-button" to="/help" aria-label="Help">
          <img src="/circle-help0.svg" alt="" width={18} height={18} />
        </Link>
        <Link
          className={`icon-button${noticeCount > 0 ? ' has-notify' : ''}`}
          to="/notifications"
          aria-label={noticeCount > 0 ? `Notifications, ${noticeCount} new` : 'Notifications'}
        >
          <img src="/bell0.svg" alt="" width={18} height={18} />
        </Link>
        <span className="header-divider" aria-hidden="true" />
        <Menu
          className="account-menu"
          menuClassName="menu-right"
          ariaLabel="Account"
          label={
            <>
              {accountInitials ? (
                <span className="avatar" aria-hidden="true">{accountInitials}</span>
              ) : null}
              <span className="account-name">{accountName}</span>
              <img src="/chevron-down1.svg" alt="" width={14} height={14} />
            </>
          }
        >
          {user ? (
            <Link to={profileHref(user.key)} role="menuitem">
              Profile
            </Link>
          ) : (
            <button type="button" role="menuitem" onClick={loginRedirect}>
              Log in to your workspaces
            </button>
          )}
          <Link to="/settings" role="menuitem">
            Settings
          </Link>
          <Link to="/help" role="menuitem">
            Help
          </Link>
          <div className="menu-dev" data-keep-open>
            <p>Dev mode</p>
            {themes.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === option.id}
                onClick={() => chooseTheme(option.id)}
              >
                <span className={`theme-swatch is-${option.id}`} aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </Menu>
      </div>

      {/* The mobile header actions are hidden while the drawer is open. */}
      {!menuOpen && (
        <>
          <Link
            className="header-search-toggle"
            to="/search"
            aria-label="Search workspaces, documents, people"
          >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="m15 15 4.5 4.5" />
          </svg>
          </Link>

          <div className="mobile-header-create">
            <CreateMenu
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              closeMenu={() => setMenuOpen(false)}
            />
          </div>

          {user ? (
            <Link
              className="mobile-header-account"
              to={profileHref(user.key)}
              aria-label={`View profile for ${user.name}`}
            >
              <span className="mobile-account-avatar" aria-hidden="true">
                {accountInitials}
              </span>
            </Link>
          ) : (
            <button
              className="mobile-header-account"
              type="button"
              onClick={loginRedirect}
              disabled={session.status === 'loading'}
              aria-label={session.status === 'loading' ? 'Checking session' : 'Log in'}
            >
              <span className="mobile-account-avatar" aria-hidden="true">
                <img src="/users0.svg" alt="" width={16} height={16} />
              </span>
            </button>
          )}
        </>
      )}
    </header>
  )
}

export default Header
