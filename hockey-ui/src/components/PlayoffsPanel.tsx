import { useState } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'
import { type PlayoffBracketProps } from '../interfaces/playoffProps'
import { getRoundLabel } from '../utils/playoffs'
import PlayoffSeriesCard from './PlayoffSeriesCard'

interface PlayoffsPanelProps {
  bracket: PlayoffBracketProps
  onBracketUpdated: (bracket: PlayoffBracketProps) => void
  onRestartSeason: () => void
  onStartFromScratch: () => void
}

const PlayoffsPanel: React.FC<PlayoffsPanelProps> = ({
  bracket,
  onBracketUpdated,
  onRestartSeason,
  onStartFromScratch,
}) => {
  const [isRestarting, setIsRestarting] = useState(false)
  const [isScratching, setIsScratching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playoffsComplete = bracket.status === 'COMPLETED'
  const currentRoundSeries = bracket.series.filter(
    (series) => series.roundNumber === bracket.currentRound,
  )
  const pastRounds = Array.from({ length: bracket.currentRound - 1 }, (_, i) => i + 1)

  const handleRestart = async () => {
    setError(null)
    setIsRestarting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to restart the season.')
      }
      onRestartSeason()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restart the season.')
    } finally {
      setIsRestarting(false)
    }
  }

  const handleStartFromScratch = async () => {
    setError(null)
    setIsScratching(true)
    try {
      const response = await fetch(`${API_BASE_URL}/playoffs/start-from-scratch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to start from scratch.')
      }
      onStartFromScratch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the league.')
    } finally {
      setIsScratching(false)
    }
  }

  return (
    <div className="playoffs-panel">
      <div className="playoffs-panel__header">
        <h2 className="playoffs-panel__title">Playoff Matches</h2>
        {!playoffsComplete && (
          <p className="playoffs-panel__subtitle">
            {getRoundLabel(bracket.currentRound, bracket.totalRounds)} · Best of 7 (first to 4 wins)
          </p>
        )}
      </div>

      {playoffsComplete && bracket.champion && (
        <div className="playoffs-champion" role="status">
          <p className="playoffs-champion__message">
            {bracket.champion.name} are the Stanley Cup champions {bracket.seasonYear}!
          </p>
          <div className="playoffs-champion__actions">
            <button
              type="button"
              className="fixtures-advance__button"
              disabled={isRestarting || isScratching}
              onClick={handleRestart}
            >
              {isRestarting ? 'Restarting…' : 'Restart Season'}
            </button>
            <button
              type="button"
              className="playoffs-champion__scratch"
              disabled={isRestarting || isScratching}
              onClick={handleStartFromScratch}
            >
              {isScratching ? 'Resetting…' : 'Start from scratch: New season, new teams?'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="playoffs-panel__error">{error}</p>}

      {!playoffsComplete && (
        <section className="playoffs-round">
          <h3 className="playoffs-round__title">
            {getRoundLabel(bracket.currentRound, bracket.totalRounds)}
          </h3>
          <div className="playoffs-round__series">
            {currentRoundSeries.map((series) => (
              <PlayoffSeriesCard
                key={series.id}
                series={series}
                playable={!series.completed}
                onSeriesUpdated={onBracketUpdated}
              />
            ))}
          </div>
        </section>
      )}

      {(playoffsComplete || pastRounds.length > 0) && (
        <div className="playoffs-history">
          {(playoffsComplete
            ? Array.from({ length: bracket.totalRounds }, (_, i) => i + 1)
            : pastRounds
          ).map((roundNumber) => {
            const roundSeries = bracket.series.filter((s) => s.roundNumber === roundNumber)
            return (
              <section key={roundNumber} className="playoffs-round playoffs-round--past">
                <h3 className="playoffs-round__title">
                  {getRoundLabel(roundNumber, bracket.totalRounds)}
                  <span className="playoffs-round__badge">Completed</span>
                </h3>
                <div className="playoffs-round__series">
                  {roundSeries.map((series) => (
                    <PlayoffSeriesCard
                      key={series.id}
                      series={series}
                      playable={false}
                      onSeriesUpdated={onBracketUpdated}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PlayoffsPanel
