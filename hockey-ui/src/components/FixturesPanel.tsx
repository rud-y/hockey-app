import { useState } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'
import {
  type FixturesResponseProps,
  type WeeklyFixtureProps,
} from '../interfaces/matchProps'
import MatchCard from './MatchCard'

interface FixturesPanelProps {
  fixturesData: FixturesResponseProps | null
  onMatchCompleted: () => void
  onWeekAdvanced: () => void
}

const isWeekComplete = (fixture: WeeklyFixtureProps) =>
  fixture.matches.every((match) => match.completed)

const FixturesPanel: React.FC<FixturesPanelProps> = ({
  fixturesData,
  onMatchCompleted,
  onWeekAdvanced,
}) => {
  const [remainingExpanded, setRemainingExpanded] = useState(false)
  const [pastExpanded, setPastExpanded] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!fixturesData || fixturesData.fixtures.length === 0) {
    return null
  }

  const { activeWeekNumber, totalWeeks, fixtures } = fixturesData
  const currentWeek = fixtures.find((fixture) => fixture.weekNumber === activeWeekNumber)
  const pastWeeks = fixtures.filter((fixture) => fixture.weekNumber < activeWeekNumber)
  const remainingWeeks = fixtures.filter((fixture) => fixture.weekNumber > activeWeekNumber)
  const currentWeekComplete = currentWeek ? isWeekComplete(currentWeek) : false
  const seasonComplete = activeWeekNumber >= totalWeeks && currentWeekComplete

  const reviewWeeks = seasonComplete ? fixtures : pastWeeks
  const reviewToggleLabel = seasonComplete
    ? pastExpanded
      ? 'Close all fixtures'
      : 'Expand all fixtures'
    : pastExpanded
      ? 'Close past fixtures'
      : 'Expand past fixtures'

  const handleAdvanceWeek = async () => {
    setError(null)
    setIsAdvancing(true)

    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/advance-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to advance to the next week.')
      }

      setRemainingExpanded(false)
      onWeekAdvanced()
    } catch (err) {
      console.error('Error advancing week:', err)
      setError(err instanceof Error ? err.message : 'Could not advance to the next week.')
    } finally {
      setIsAdvancing(false)
    }
  }

  const renderWeekSection = (
    fixture: WeeklyFixtureProps,
    playable: boolean,
    muted = false,
  ) => (
    <section
      key={fixture.id}
      style={{ ...styles.weekSection, ...(muted ? styles.weekSectionMuted : {}) }}
    >
      <h3 style={styles.weekTitle}>
        Fixtures Week {fixture.weekNumber}
        {isWeekComplete(fixture) && <span style={styles.completedBadge}>Completed</span>}
      </h3>
      <div style={styles.matchGrid}>
        {fixture.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            playable={playable}
            onMatchCompleted={onMatchCompleted}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Season Fixtures</h2>

      {seasonComplete ? (
        <p style={styles.subtitle}>
          Season complete. Expand all fixtures below to review every match result.
        </p>
      ) : (
        <p style={styles.subtitle}>
          Only Fixtures Week {activeWeekNumber} can be played. Finish every match in this week
          before moving on.
        </p>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {!seasonComplete && currentWeek && renderWeekSection(currentWeek, true)}

      {!seasonComplete && currentWeekComplete && activeWeekNumber < totalWeeks && (
        <button
          type="button"
          style={styles.advanceButton}
          disabled={isAdvancing}
          onClick={handleAdvanceWeek}
        >
          {isAdvancing ? 'Loading next week...' : 'Play next week fixtures'}
        </button>
      )}

      {seasonComplete && (
        <p style={styles.seasonComplete}>All fixture weeks have been completed.</p>
      )}

      {reviewWeeks.length > 0 && (
        <div style={styles.collapsibleSection}>
          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setPastExpanded((expanded) => !expanded)}
          >
            {reviewToggleLabel}
          </button>

          {pastExpanded && (
            <div style={styles.collapsibleWeeks}>
              {reviewWeeks.map((fixture) => renderWeekSection(fixture, false, true))}
            </div>
          )}
        </div>
      )}

      {!seasonComplete && remainingWeeks.length > 0 && (
        <div style={styles.collapsibleSection}>
          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setRemainingExpanded((expanded) => !expanded)}
          >
            {remainingExpanded ? 'Close remaining fixtures' : 'Expand remaining fixtures'}
          </button>

          {remainingExpanded && (
            <div style={styles.collapsibleWeeks}>
              {remainingWeeks.map((fixture) =>
                renderWeekSection(fixture, false, true),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#1a1a1a',
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.95rem',
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontSize: '0.9rem',
  },
  weekSection: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)',
  },
  weekSectionMuted: {
    backgroundColor: '#fafafa',
  },
  weekTitle: {
    margin: '0 0 16px',
    fontSize: '1.1rem',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  completedBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  advanceButton: {
    alignSelf: 'center',
    padding: '14px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#15803d',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  seasonComplete: {
    margin: 0,
    textAlign: 'center' as const,
    color: '#15803d',
    fontWeight: 600,
  },
  collapsibleSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  toggleButton: {
    alignSelf: 'center',
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    color: '#334155',
    fontWeight: 600,
    cursor: 'pointer',
  },
  collapsibleWeeks: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
}

export default FixturesPanel
