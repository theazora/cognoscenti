import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

function Guide({ title, children }: { title: string; children: ReactNode }) {
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
            <span aria-current="page">{title}</span>
          </span>
        </nav>
        <h1>{title}</h1>
      </header>
      <div className="panel profile-section">{children}</div>
    </section>
  )
}

export function HelpPage() {
  return (
    <Guide title="Help">
      <p>Circle Weaver is the workspace. This interface talks to the Weaver server you are signed into.</p>
      <ol>
        <li>Sign in. Your profile and workspace list come from that session.</li>
        <li>
          Request a site from <Link to="/sites">Sites</Link>. A site id is created only after the request is granted.
        </li>
        <li>
          Create a workspace from <Link to="/workspaces">Workspaces</Link> using that site id.
        </li>
        <li>Open the workspace, then add meetings, documents, discussions, notes, and action items there.</li>
        <li>
          Name, email, and description are saved on your profile. Time zone and email digest are saved in{' '}
          <Link to="/settings">Settings</Link>.
        </li>
      </ol>
    </Guide>
  )
}

export function AboutPage() {
  return (
    <Guide title="About">
      <p>
        Circle Weaver is a collaboration system. People share meetings, documents, discussions, and action items inside
        a workspace. A site holds one or more workspaces, and membership decides who can see that work.
      </p>
      <p>
        This screen is the newer interface. It uses the same Weaver server as the original pages: the same account, the
        same sites, and the same workspace files.
      </p>
    </Guide>
  )
}

export function PrivacyPage() {
  return (
    <Guide title="Privacy">
      <p>
        The privacy policy installed with this Weaver server is shown below.{' '}
        <a href="/weaver/PrivacyPolicy.html">Open it in a separate page</a>.
      </p>
      <iframe
        title="Circle Weaver privacy policy"
        src="/weaver/PrivacyPolicy.html"
        style={{ width: '100%', minHeight: '70vh', border: '1px solid var(--line, #ddd)', background: '#fff' }}
      />
    </Guide>
  )
}

export function TermsPage() {
  return (
    <Guide title="Terms">
      <p>
        This server does not ship a separate terms-of-service document. These are the rules the software already
        enforces:
      </p>
      <ul>
        <li>Changing a workspace requires a signed-in account that can update that workspace.</li>
        <li>Workspace members can see the meetings, documents, discussions, and action items stored there.</li>
        <li>A new site starts as a request. It exists only after that request is granted.</li>
        <li>
          Personal information used to run the account is described in the <Link to="/privacy">privacy notice</Link>.
        </li>
      </ul>
    </Guide>
  )
}
