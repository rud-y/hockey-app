import { useState, type CSSProperties } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'
import { type TableRowProps } from '../interfaces/tableRowProps'
import { compareStandingsRows, getPlayoffTeamCount } from '../utils/playoffs'

interface LeagueTableProps {
  rows: TableRowProps[]
  seasonComplete?: boolean
  playoffsStarted?: boolean
  playoffsComplete?: boolean
  onRowDeleted: () => void
  onPlayoffsStarted: () => void
}

const formatStreak = (row: TableRowProps) => {
  if (!row.streak || row.streakCount === 0) {
    return '-'
  }

  return `${row.streak}${row.streakCount}`
}

const playoffCellExtras = (
  isFirstPlayoff: boolean,
  isLastPlayoff: boolean,
): CSSProperties => ({
  backgroundColor: 'var(--playoff-blue-bg)',
  borderTop: isFirstPlayoff
    ? '2px solid var(--playoff-blue-border)'
    : '1px solid var(--playoff-blue-border)',
  borderBottom: isLastPlayoff
    ? '4px solid var(--playoff-cut-line)'
    : '1px solid var(--playoff-blue-border)',
})

const LeagueTable: React.FC<LeagueTableProps> = ({
  rows,
  seasonComplete = false,
  playoffsStarted = false,
  playoffsComplete = false,
  onRowDeleted,
  onPlayoffsStarted,
}) => {
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStartingPlayoffs, setIsStartingPlayoffs] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const sortedRows = [...rows].sort(compareStandingsRows)
  const playoffSpots =
    seasonComplete && !playoffsStarted ? getPlayoffTeamCount(sortedRows.length) : 0
  const showPlayoffMarkers = playoffSpots > 0
  const hideTableBody = playoffsStarted && !playoffsComplete
  const collapsible = playoffsComplete
  const showTableContent = !hideTableBody && (!collapsible || expanded)

  const handleDelete = async (row: TableRowProps) => {
    if (!row.id) {
      setError('Cannot delete this row because it has no id.')
      return
    }

    setError(null)
    setDeletingRowId(row.id)

    try {
      const response = await fetch(`${API_BASE_URL}/league-tables/rows/${row.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to delete team.')
      }

      onRowDeleted()
    } catch (err) {
      console.error('Error deleting team:', err)
      setError(err instanceof Error ? err.message : 'Could not delete team.')
    } finally {
      setDeletingRowId(null)
    }
  }

  const handleStartPlayoffs = async () => {
    setError(null)
    setIsStartingPlayoffs(true)

    try {
      const response = await fetch(`${API_BASE_URL}/playoffs/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to start playoffs.')
      }

      onPlayoffsStarted()
    } catch (err) {
      console.error('Error starting playoffs:', err)
      setError(err instanceof Error ? err.message : 'Could not start playoffs.')
    } finally {
      setIsStartingPlayoffs(false)
    }
  }

  if (hideTableBody) {
    return null
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>League Table</h2>

      {showPlayoffMarkers && (
        <div style={styles.playoffBannerRow}>
          <p style={styles.playoffBanner} role="status">
            These are teams getting to the Play-offs!
          </p>
          <button
            type="button"
            style={styles.startPlayoffsButton}
            disabled={isStartingPlayoffs}
            onClick={handleStartPlayoffs}
          >
            {isStartingPlayoffs ? 'Starting…' : 'Ready to start Playoff matches?'}
          </button>
        </div>
      )}

      {collapsible && (
        <button
          type="button"
          className="fixtures-collapsible__toggle"
          style={styles.collapseToggle}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide League Table' : 'Expand League Table'}
        </button>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {showTableContent &&
        (sortedRows.length === 0 ? (
          <p style={styles.empty}>No teams in the league table yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Team</th>
                <th style={styles.th}>GP</th>
                <th style={styles.th}>W</th>
                <th style={styles.th}>L</th>
                <th style={styles.th}>OTL</th>
                <th style={styles.th}>GF</th>
                <th style={styles.th}>GA</th>
                <th style={styles.th}>PTS</th>
                <th style={styles.th}>Streak</th>
                {!playoffsStarted && <th style={styles.thAction} aria-label="Delete team" />}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => {
                const isPlayoff =
                  (showPlayoffMarkers || playoffsComplete) &&
                  index < getPlayoffTeamCount(sortedRows.length)
                const spots = getPlayoffTeamCount(sortedRows.length)
                const isFirstPlayoff = isPlayoff && index === 0
                const isLastPlayoff = isPlayoff && index === spots - 1
                const extras =
                  (showPlayoffMarkers || playoffsComplete) && isPlayoff
                    ? playoffCellExtras(isFirstPlayoff, isLastPlayoff)
                    : null

                return (
                  <tr
                    key={row.id ?? row.team.shortName}
                    aria-label={
                      isPlayoff
                        ? `${row.team.name}, qualified for Play-offs`
                        : undefined
                    }
                  >
                    <td
                      style={{
                        ...styles.td,
                        ...extras,
                        ...(isPlayoff && (showPlayoffMarkers || playoffsComplete)
                          ? { borderLeft: '3px solid var(--playoff-blue)' }
                          : {}),
                      }}
                    >
                      <strong>{row.team.name}</strong>
                      <span style={styles.shortName}> ({row.team.shortName})</span>
                    </td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.gamesPlayed}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.wins}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.losses}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.otLosses}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.goalsFor ?? 0}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.goalsAgainst ?? 0}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{row.points}</td>
                    <td style={{ ...styles.tdCenter, ...extras }}>{formatStreak(row)}</td>
                    {!playoffsStarted && (
                      <td
                        style={{
                          ...styles.tdAction,
                          ...extras,
                          ...(isPlayoff && showPlayoffMarkers
                            ? { borderRight: '3px solid var(--playoff-blue)' }
                            : {}),
                        }}
                      >
                        <button
                          type="button"
                          style={styles.deleteButton}
                          onClick={() => handleDelete(row)}
                          disabled={deletingRowId === row.id || seasonComplete}
                          aria-label={`Delete ${row.team.name}`}
                          title={`Delete ${row.team.name}`}
                        >
                          {deletingRowId === row.id ? '…' : '×'}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ))}
    </div>
  )
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '900px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow)',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '1.4rem',
    color: 'var(--text-h)',
  },
  playoffBannerRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  playoffBanner: {
    margin: 0,
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--playoff-blue-bg)',
    border: '1px solid var(--playoff-blue-border)',
    color: 'var(--playoff-blue)',
    fontSize: '0.95rem',
    fontWeight: 600,
    textAlign: 'left' as const,
    flex: '1 1 240px',
  },
  startPlayoffsButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid var(--playoff-blue-border)',
    backgroundColor: 'var(--playoff-blue)',
    color: '#0f172a',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  collapseToggle: {
    marginBottom: '12px',
    alignSelf: 'flex-start',
  },
  error: {
    margin: '0 0 12px',
    color: 'var(--danger)',
    fontSize: '0.9rem',
  },
  empty: {
    margin: 0,
    color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid var(--border)',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  thAction: {
    width: '48px',
    padding: '10px 12px',
    borderBottom: '2px solid var(--border)',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-h)',
  },
  tdCenter: {
    padding: '12px',
    borderBottom: '1px solid var(--border-subtle)',
    textAlign: 'center' as const,
    color: 'var(--text-h)',
  },
  tdAction: {
    padding: '12px',
    borderBottom: '1px solid var(--border-subtle)',
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: '28px',
    height: '28px',
    border: '1px solid var(--danger-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger)',
    fontSize: '1.1rem',
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  },
  shortName: {
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
}

export default LeagueTable
