import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { documentsPath } from '../data/documents'
import { applyTheme, brandMark, DEFAULT_THEME, readTheme } from '../theme'
import { workspaceFromLocation } from '../data/workspaces'

const homeLinks = [
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/meetings', label: 'Meetings' },
  { to: '/tasks', label: 'To-do Tasks' },
  { to: '/discussions', label: 'Discussions' },
]

const organizationLinks = [
  { to: '/notifications', label: 'Notifications' },
  { to: '/emails', label: 'Emails' },
  { to: '/documents', label: 'Documents' },
]

const adminLinks = [
  { to: '/sites', label: 'My Sites' },
  { to: '/help', label: 'Help' },
  { to: '/settings', label: 'Settings' },
]

function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const workspace = workspaceFromLocation(location.pathname, location.search)
  const inputRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    const sync = () => setTheme(readTheme())
    window.addEventListener('weaver-theme', sync)
    return () => window.removeEventListener('weaver-theme', sync)
  }, [])

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = inputRef.current?.value.trim() ?? ''
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="footer-brand" to="/">
          <span className="footer-mark" aria-hidden="true">
            <picture>
              <source media="(max-width: 767px)" srcSet="/weaver-mark.svg" />
              <img
                src={brandMark(theme)}
                alt=""
                width={40}
                height={40}
                onError={() => {
                  if (theme !== DEFAULT_THEME) applyTheme(DEFAULT_THEME)
                }}
              />
            </picture>
          </span>
          <img className="brand-name" src="/weaver-wordmark.svg" alt="Circle Weaver" />
        </Link>
        <form className="footer-search" onSubmit={onSearch}>
          <img src="/search1.png" alt="" width={14} height={14} />
          <label className="visually-hidden" htmlFor="footer-search">
            Search workspaces, documents
          </label>
          <input
            id="footer-search"
            ref={inputRef}
            type="search"
            name="q"
            placeholder="Search workspaces, documents.."
          />
        </form>
      </div>

      <div className="footer-columns">
        <FooterColumn title="Home" links={homeLinks} />
        <FooterColumn
          title="Organization"
          links={organizationLinks.map((link) =>
            link.label === 'Documents' ? { ...link, to: documentsPath(workspace.id) } : link,
          )}
        />
        <FooterColumn title="Administration" links={adminLinks} className="footer-admin" />
      </div>

      <p className="footer-legal footer-legal-mobile">
        © {new Date().getFullYear()} Weaver
        {' · '}
        <Link to="/privacy">Privacy</Link>
        {' · '}
        <Link to="/terms">Terms</Link>
      </p>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string
  links: { to: string; label: string }[]
  className?: string
}) {
  return (
    <nav aria-label={title} className={className}>
    <p>{title}</p>
    {links.map((link) => (
      <Link key={link.label} to={link.to}>
        {link.label}
      </Link>
    ))}
    </nav>
  )
}

export default Footer
