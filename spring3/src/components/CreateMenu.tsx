
import { Link } from 'react-router-dom'
import { documentsPath } from '../data/documents'
import Menu from './Menu'

// Available creation options and their default destinations.
const createItems = [
  {
    to: '/sites',
    label: 'Site',
    detail: 'Request a site, then grant it',
    icon: '/users1.svg',
  },
  {
    to: '/workspaces',
    label: 'Workspace',
    detail: 'Create a workspace inside a site',
    icon: '/house0.svg',
  },
  {
    to: '/meetings/new',
    label: 'Meeting',
    detail: 'Schedule with agenda & Zoom link',
    icon: '/calendar0.svg',
  },
  {
    to: '/discussions?new=1',
    label: 'Discussion',
    detail: 'Start a topic for the group',
    icon: '/msg0.svg',
  },
  {
    to: '/documents',
    label: 'Document',
    detail: 'Upload or link a file',
    icon: '/file0.svg',
  },
  {
    to: '/action-items',
    label: 'Action item',
    detail: 'Assign a task with a due date',
    icon: '/check0.svg',
  },
  {
    to: '/notes',
    label: 'Note',
    detail: 'Private or shared notes',
    icon: '/pen0.svg',
  },
]

type CreateMenuProps = {
  workspaceId: string
  workspaceName: string
  closeMenu: () => void
  className?: string
}

// Shared Create menu for the sidebar and mobile header.
// Meeting and document destinations depend on the active workspace.
function CreateMenu({
  workspaceId,
  workspaceName,
  closeMenu,
  className = 'create-button',
}: CreateMenuProps) {
  return (
    <Menu
      className={className}
      menuClassName="create-menu"
      ariaLabel="Create"
      label={
        <>
          <img src="/plus0.svg" alt="" width={14} height={14} />
          <span>Create</span>
          <img
            className="create-chevron"
            src="/chevron-down0.svg"
            alt=""
            width={14}
            height={14}
          />
        </>
      }
    >
      <p className="create-menu-heading">
        Create in {workspaceName}
      </p>

      {createItems.map((item) => (
        <Link
          key={item.label}
          className="create-option"
          to={
            item.label === 'Meeting'
              ? `/meetings/new?workspace=${workspaceId}`
              : item.label === 'Document'
                ? documentsPath(workspaceId, 'file')
                : item.to
          }
          role="menuitem"
          onClick={closeMenu}
        >
          <span className="icon-tile">
            <img src={item.icon} alt="" width={18} height={18} />
          </span>

          <span className="create-option-text">
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </span>
        </Link>
      ))}
    <button type="button" role="menuitem" className="create-sheet-cancel">
        Cancel
      </button>
    </Menu>
  )
}

export default CreateMenu
