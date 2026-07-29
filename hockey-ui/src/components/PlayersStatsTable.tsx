import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'

export interface PlayerStatsRow {
  playerId: number
  playerName: string
  teamId: number | null
  teamName: string
  teamShortName: string
  goals: number
  assists: number
  points: number
}

interface PlayersStatsTableProps {
  refreshKey?: number
}

const PlayersStatsTable: React.FC<PlayersStatsTableProps> = ({ refreshKey = 0 }) => {
  const [rows, setRows] = useState<PlayerStatsRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ seasonYear: LEAGUE_CONFIG.seasonYear })

    fetch(`${API_BASE_URL}/players/stats?${params}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load player stats.')
        }
        return res.json()
      })
      .then((data: PlayerStatsRow[]) => {
        setRows(data)
      })
      .catch((err) => {
        console.error('Error loading player stats:', err)
        setError(err instanceof Error ? err.message : 'Could not load player stats.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats, refreshKey])

  if (loading) {
    return <p className="players-stats__empty">Loading player stats…</p>
  }

  if (error) {
    return <p className="players-stats__error">{error}</p>
  }

  if (rows.length === 0) {
    return <p className="players-stats__empty">No players registered yet.</p>
  }

  return (
    <div className="players-stats">
      <table className="players-stats__table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Team</th>
            <th>G</th>
            <th>A</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td className="players-stats__name">{row.playerName}</td>
              <td>{row.teamShortName}</td>
              <td>{row.goals}</td>
              <td>{row.assists}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PlayersStatsTable
