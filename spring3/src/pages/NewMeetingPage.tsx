import { useEffect, useMemo, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { openWorkspace } from '../data/live'
import {
  DEFAULT_DATE,
  DEFAULT_TIME,
  DEFAULT_ZONE,
  TIMEZONE_OPTIONS,
  defaultAgenda,
  getMeeting,
  type AgendaItem,
} from '../data/meetings'
import { useSession } from '../data/session'
import { weaverPost } from '../data/weaver'
import { emptyWorkspace, normalizeWorkspaceId, useWorkspaces, workspaceById } from '../data/workspaces'

const ZONE_OFFSET: Record<string, string> = {
  'EST (US & Canada)': '-05:00',
  'EDT (US & Canada)': '-04:00',
  'CST (US & Canada)': '-06:00',
  'PST (US & Canada)': '-08:00',
}

function startMillis(date: string, time: string, zone: string) {
  const offset = ZONE_OFFSET[zone] ?? '-05:00'
  const parsed = Date.parse(`${date}T${time}:00${offset}`)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

function NewMeetingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const session = useSession()
  const fromAll = params.get('from') === 'all'
  useWorkspaces()
  const workspaceId = normalizeWorkspaceId(params.get('workspace'))
  const existing = params.get('id') ? getMeeting(params.get('id') as string) : undefined
  const workspace =
    workspaceById(existing ? normalizeWorkspaceId(existing.workspaceId) : workspaceId) ?? emptyWorkspace()

  const [name, setName] = useState(existing?.name ?? '')
  const [date, setDate] = useState(existing?.date || DEFAULT_DATE)
  const [startTime, setStartTime] = useState(existing?.startTime || DEFAULT_TIME)
  const [timezone, setTimezone] = useState(existing?.timezone || DEFAULT_ZONE)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [agenda, setAgenda] = useState<AgendaItem[]>(existing?.agenda ?? defaultAgenda())
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const row = params.get('id') ? getMeeting(params.get('id') as string) : undefined
    if (!row) {
      return
    }
    setName(row.name)
    setDate(row.date || DEFAULT_DATE)
    setStartTime(row.startTime || DEFAULT_TIME)
    setTimezone(row.timezone || DEFAULT_ZONE)
    setDescription(row.description)
    setAgenda(row.agenda)
  }, [params])

  const total = useMemo(() => agenda.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0), [agenda])
  const cancelTo = fromAll ? '/meetings/all' : workspace.path

  function importDetails() {
    setName('UX working session')
    setDescription(
      'This is a meeting description example for this meeting. This description could be long.',
    )
  }

  function updateItem(id: string, patch: Partial<AgendaItem>) {
    setAgenda((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeItem(id: string) {
    setAgenda((rows) => rows.filter((row) => row.id !== id))
  }

  function addItem() {
    setAgenda((rows) => [
      ...rows,
      {
        id: `ag-${Date.now()}`,
        title: 'New item',
        minutes: 10,
        actualMinutes: null,
        timerRunning: false,
        timerStartedAt: null,
        presenter: '',
        notes: '',
      },
    ])
  }

  function onDragStart(index: number) {
    setDragIndex(index)
  }

  function onDrop(index: number) {
    if (dragIndex == null || dragIndex === index) {
      setDragIndex(null)
      return
    }
    setAgenda((rows) => {
      const next = rows.slice()
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
  }

  async function saveMeeting(state: number) {
    if (!workspace.siteKey || !workspace.pageKey) {
      setError('Open a workspace before creating a meeting.')
      return
    }
    if (!name.trim()) {
      setError('A meeting needs a name.')
      return
    }
    setPending(true)
    setError('')
    try {
      const created = await weaverPost<{ id?: string }>(
        `/v/${encodeURIComponent(workspace.siteKey)}/${encodeURIComponent(workspace.pageKey)}/meetingCreate.json`,
        {
          name: name.trim(),
          state,
          startTime: startMillis(date, startTime, timezone),
          duration: total,
          description: description.trim(),
          agenda: agenda
            .filter((item) => item.title.trim())
            .map((item, index) => ({
              selected: true,
              subject: item.title.trim(),
              duration: item.minutes,
              position: index + 1,
            })),
        },
      )
      const you = session.status === 'signed-in' ? session.user : null
      await openWorkspace(workspace.siteKey, workspace.pageKey, you)
      if (created.id) {
        navigate(`/meetings/${created.id}?workspace=${encodeURIComponent(workspace.id)}`)
        return
      }
      navigate(workspace.path)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the meeting.')
    } finally {
      setPending(false)
    }
  }

  function onDraft() {
    void saveMeeting(0)
  }

  function onCreate(event: FormEvent) {
    event.preventDefault()
    void saveMeeting(1)
  }

  return (
    <section className="meeting-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span className="breadcrumb-item">
          <img src="/house0.svg" alt="" width={12} height={12} />
          <Link to={workspace.path}>{workspace.name}</Link>
        </span>
        <span className="breadcrumb-item">
          <img src="/chevron-right0.svg" alt="" width={12} height={12} />
          <span aria-current="page">Create New Meeting</span>
        </span>
      </nav>

      <header className="meeting-page-head">
        <h1>Create New Meeting</h1>
        <button className="chip" type="button" onClick={importDetails}>
          Import Meeting Details
        </button>
      </header>

      <form className="meeting-form" onSubmit={onCreate}>
        <label className="field">
          <span>Meeting name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label className="field">
            <span>Start time</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </label>
          <label className="field">
            <span>Timezone</span>
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {TIMEZONE_OPTIONS.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>

        <section className="agenda-editor" aria-labelledby="agenda-title">
          <div className="card-heading">
            <h2 id="agenda-title">Agenda</h2>
            <p>Total duration: {total} minutes</p>
          </div>
          <ul className="agenda-edit-list">
            {agenda.map((item, index) => (
              <li
                key={item.id}
                className={`agenda-edit-row${dragIndex === index ? ' dragging' : ''}`}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(index)}
              >
                <span className="drag-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <input
                  aria-label="Agenda item"
                  value={item.title}
                  onChange={(event) => updateItem(item.id, { title: event.target.value })}
                />
                <label className="minutes-field">
                  <input
                    type="number"
                    min={1}
                    value={item.minutes}
                    onChange={(event) => updateItem(item.id, { minutes: Number(event.target.value) || 0 })}
                  />
                  min
                </label>
                <button className="icon-text" type="button" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button className="chip" type="button" onClick={addItem}>
            + Add item
          </button>
        </section>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <Link className="chip" to={cancelTo}>
            Cancel
          </Link>
          <button className="chip" type="button" onClick={onDraft} disabled={pending}>
            Save as draft
          </button>
          <button className="button-light" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Create meeting'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default NewMeetingPage
