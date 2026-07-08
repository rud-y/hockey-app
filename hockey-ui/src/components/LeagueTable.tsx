import { useState } from 'react'
import { API_BASE_URL } from '../constants/api'
import { type TableRowProps } from '../interfaces/tableRowProps'

interface LeagueTableProps {
  rows: TableRowProps[]
  onRowDeleted: () => void
}

const formatStreak = (row: TableRowProps) => {
  if (!row.streak || row.streakCount === 0) {
    return '-'
  }

  return `${row.streak}${row.streakCount}`
}

const LeagueTable: React.FC<LeagueTableProps> = ({ rows, onRowDeleted }) => {
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>League Table</h2>

      {error && <p style={styles.error}>{error}</p>}

      {rows.length === 0 ? (
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
              <th style={styles.th}>PTS</th>
              <th style={styles.th}>Streak</th>
              <th style={styles.thAction} aria-label="Delete team" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id ?? row.team.shortName}>
                <td style={styles.td}>
                  <strong>{row.team.name}</strong>
                  <span style={styles.shortName}> ({row.team.shortName})</span>
                </td>
                <td style={styles.tdCenter}>{row.gamesPlayed}</td>
                <td style={styles.tdCenter}>{row.wins}</td>
                <td style={styles.tdCenter}>{row.losses}</td>
                <td style={styles.tdCenter}>{row.otLosses}</td>
                <td style={styles.tdCenter}>{row.points}</td>
                <td style={styles.tdCenter}>{formatStreak(row)}</td>
                <td style={styles.tdAction}>
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={() => handleDelete(row)}
                    disabled={deletingRowId === row.id}
                    aria-label={`Delete ${row.team.name}`}
                    title={`Delete ${row.team.name}`}
                  >
                    {deletingRowId === row.id ? '…' : '×'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
