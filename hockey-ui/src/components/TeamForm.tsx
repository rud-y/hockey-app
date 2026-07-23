import { useState, type FormEvent } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'
import { type TableRowProps } from '../interfaces/tableRowProps'
import { MAX_TEAMS } from '../utils/matchSimulation'

interface TeamFormProps {
  onTeamCreated: () => void
  existingRows: TableRowProps[]
  fixturesGenerated: boolean
  onFixturesGenerated: () => void
}

const EMPTY_PLAYERS = ['', '', '', '', '']

const TeamForm: React.FC<TeamFormProps> = ({
  onTeamCreated,
  existingRows,
  fixturesGenerated,
  onFixturesGenerated,
}) => {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [playerNames, setPlayerNames] = useState<string[]>(EMPTY_PLAYERS)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingFixtures, setIsGeneratingFixtures] = useState(false)

  const teamLimitReached = existingRows.length >= MAX_TEAMS
  const canGenerateFixtures = !fixturesGenerated && existingRows.length >= 2

  const handlePlayerChange = (index: number, value: string) => {
    setPlayerNames((prev) => prev.map((player, i) => (i === index ? value : player)))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !shortName.trim()) {
      setError('Team name and short name are required.')
      return
    }

    if (teamLimitReached) {
      setError(`Maximum of ${MAX_TEAMS} teams allowed.`)
      return
    }

    if (fixturesGenerated) {
      setError('Fixtures have already been generated.')
      return
    }

    const normalizedName = name.trim().toLowerCase()
    const normalizedShortName = shortName.trim().toLowerCase()
    const isDuplicate = existingRows.some(
      (row) =>
        row.team.name.toLowerCase() === normalizedName ||
        row.team.shortName.toLowerCase() === normalizedShortName,
    )

    if (isDuplicate) {
      setError('This team is already in the league table.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          shortName: shortName.trim().toUpperCase(),
          playerNames: playerNames.map((player) => player.trim()).filter(Boolean),
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to create team.')
      }

      setName('')
      setShortName('')
      setPlayerNames(EMPTY_PLAYERS)
      onTeamCreated()
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err instanceof Error ? err.message : 'Could not create team. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateFixtures = async () => {
    setError(null)

    if (existingRows.length < 2) {
      setError('Add at least 2 teams before generating fixtures.')
      return
    }

    if (existingRows.length % 2 !== 0) {
      setError('The league has to have even number of teams.')
      return
    }

    if (fixturesGenerated) {
      setError('Fixtures have already been generated.')
      return
    }

    setIsGeneratingFixtures(true)

    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to generate fixtures.')
      }

      onFixturesGenerated()
    } catch (err) {
      console.error('Error generating fixtures:', err)
      setError(err instanceof Error ? err.message : 'Could not generate fixtures.')
    } finally {
      setIsGeneratingFixtures(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Register a Team</h2>

      <label style={styles.label}>
        Team name
        <input
          style={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Toronto Maple Leafs"
        />
      </label>

      <label style={styles.label}>
        Short name
        <input
          style={styles.input}
          value={shortName}
          onChange={(event) => setShortName(event.target.value)}
          placeholder="TOR"
          maxLength={5}
        />
      </label>

      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Players (5)</legend>
        {playerNames.map((playerName, index) => (
          <label key={index} style={styles.label}>
            Player {index + 1}
            <input
              style={styles.input}
              value={playerName}
              onChange={(event) => handlePlayerChange(index, event.target.value)}
              placeholder={`Player ${index + 1} name`}
            />
          </label>
        ))}
      </fieldset>

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" style={styles.button} disabled={isSubmitting || fixturesGenerated || teamLimitReached}>
        {isSubmitting ? 'Creating...' : 'Add Team to League Table'}
      </button>

      <button
        type="button"
        style={styles.generateButton}
        disabled={!canGenerateFixtures || isGeneratingFixtures}
        onClick={handleGenerateFixtures}
      >
        {isGeneratingFixtures ? 'Generating...' : 'Finish and Generate First Fixtures'}
      </button>

      {teamLimitReached && !fixturesGenerated && (
        <p style={styles.helperText}>You have reached the maximum of {MAX_TEAMS} teams.</p>
      )}

      {!fixturesGenerated && existingRows.length >= 2 && existingRows.length % 2 !== 0 && (
        <p style={styles.helperText}>The league has to have even number of teams.</p>
      )}
    </form>
  )
}

const styles = {
  form: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow)',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    color: 'var(--text-h)',
  },
  fieldset: {
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '16px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  legend: {
    padding: '0 6px',
    color: 'var(--text)',
    fontWeight: 600,
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    fontSize: '0.9rem',
    color: 'var(--text)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--input-border)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    fontSize: '1rem',
  },
  button: {
    marginTop: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--green)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
  generateButton: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--green-dim)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  helperText: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  error: {
    margin: 0,
    color: 'var(--danger)',
    fontSize: '0.9rem',
  },
}

export default TeamForm
